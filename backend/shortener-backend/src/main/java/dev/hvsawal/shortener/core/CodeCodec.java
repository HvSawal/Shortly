package dev.hvsawal.shortener.core;

import dev.hvsawal.shortener.configuration.CodeV2Props;

import java.math.BigInteger;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class CodeCodec {
    private static final BigInteger BI_62 = BigInteger.valueOf(62);

    // V1
    private final Feistel64 feistel;
    private final int minLenV1;

    // V2
    private final CodeV2Props v2;

    /**
     * Backwards-compatible constructor for V1-only usage (existing call sites).
     * This keeps your existing behavior.
     */
    public CodeCodec(String secretKey, int rounds, int minLen) {
        this.feistel = new Feistel64(secretKey, rounds);
        this.minLenV1 = Math.max(1, minLen);
        this.v2 = new CodeV2Props(false, "_", 5, 10, Long.MAX_VALUE, secretKey);
    }

    /**
     * New constructor used by Spring when V2 is enabled.
     * V1 still works for old rows.
     */
    public CodeCodec(String secretKey, int rounds, int minLenV1, CodeV2Props v2Props) {
        this.feistel = new Feistel64(secretKey, rounds);
        this.minLenV1 = Math.max(1, minLenV1);
        this.v2 = v2Props;
    }

    public String encodeId(long id) {
        if (id <= 0) throw new IllegalArgumentException("id must be > 0");

        // Use V2 only for ids after cutover
        if (v2.enabled() && Long.compareUnsigned(id, v2.startId()) >= 0) {
            return encodeV2(id);
        }

        return encodeV1(id);
    }

    public long decodeToId(String code) {
        if (code == null || code.isBlank()) throw new IllegalArgumentException("code is blank");

        if (v2.enabled() && code.startsWith(v2.prefix())) {
            return decodeV2(code);
        }

        return decodeV1(code);
    }

    // ---------------- V1 (unchanged) ----------------

    private String encodeV1(long id) {
        long publicId = feistel.scramble(id);
        String code = Base62.encode(publicId);
        return leftPad(code, minLenV1);
    }

    private long decodeV1(String code) {
        String trimmed = trimLeadingZeros(code);
        long publicId = Base62.decode(trimmed);
        long id = feistel.unscramble(publicId);
        if (id <= 0) throw new IllegalArgumentException("decoded id invalid");
        return id;
    }

    // ---------------- V2 (short, variable length) ----------------

    private String encodeV2(long id) {
        int L = pickLengthUnsigned(id, v2.minLength(), v2.maxLength());
        if (L < 0) {
            // Safety fallback: if id exceeds capacity of maxLength
            return encodeV1(id);
        }

        BigInteger m = pow62(L);
        BigInteger a = deriveA(L, m, v2.key());
        BigInteger b = deriveB(L, m, v2.key());

        BigInteger x = unsignedLongToBigInt(id);
        BigInteger y = Affine62.permute(x, a, b, m);

        // y < 62^L <= 62^10 (~8.39e17), fits in signed long safely.
        long yLong = y.longValueExact();

        String body = Base62.encodeFixed(yLong, L);
        return v2.prefix() + body;
    }

    private long decodeV2(String code) {
        String body = code.substring(v2.prefix().length());
        int L = body.length();

        if (L < v2.minLength() || L > v2.maxLength()) {
            throw new IllegalArgumentException("Invalid v2 code length: " + L);
        }

        BigInteger m = pow62(L);
        BigInteger a = deriveA(L, m, v2.key());
        BigInteger b = deriveB(L, m, v2.key());
        BigInteger aInv = a.modInverse(m);

        long yLong = Base62.decode(body);
        BigInteger y = unsignedLongToBigInt(yLong);

        BigInteger x = Affine62.invert(y, aInv, b, m);
        long id = x.longValueExact();

        if (id <= 0) throw new IllegalArgumentException("decoded id invalid");
        return id;
    }

    private static int pickLengthUnsigned(long id, int minLen, int maxLen) {
        BigInteger x = unsignedLongToBigInt(id);
        for (int L = minLen; L <= maxLen; L++) {
            if (x.compareTo(pow62(L)) < 0) return L;
        }
        return -1;
    }

    private static BigInteger pow62(int L) {
        return BI_62.pow(L);
    }

    private static BigInteger deriveA(int L, BigInteger m, String key) {
        BigInteger raw = hashToBigInt(key + "|a|" + L);
        return Affine62.makeCoprimeTo62Power(raw, m);
    }

    private static BigInteger deriveB(int L, BigInteger m, String key) {
        BigInteger raw = hashToBigInt(key + "|b|" + L);
        return raw.mod(m);
    }

    private static BigInteger hashToBigInt(String s) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] d = md.digest(s.getBytes(StandardCharsets.UTF_8));
            return new BigInteger(1, d);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static BigInteger unsignedLongToBigInt(long v) {
        if (v >= 0) return BigInteger.valueOf(v);
        return BigInteger.valueOf(v & Long.MAX_VALUE).setBit(63);
    }

    // ---------------- small helpers ----------------

    private static String leftPad(String s, int minLen) {
        if (s.length() >= minLen) return s;
        return "0".repeat(minLen - s.length()) + s;
    }

    private static String trimLeadingZeros(String s) {
        int i = 0;
        while (i < s.length() - 1 && s.charAt(i) == '0') i++;
        return s.substring(i);
    }
}