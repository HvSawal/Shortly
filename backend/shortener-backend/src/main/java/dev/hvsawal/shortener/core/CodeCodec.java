package dev.hvsawal.shortener.core;

public final class CodeCodec {
    private final Feistel64 feistel;
    private final int minLen;

    public CodeCodec(String secretKey, int rounds, int minLen) {
        this.feistel = new Feistel64(secretKey, rounds);
        this.minLen = Math.max(1, minLen);
    }

    public String encodeId(long id) {
        if (id <= 0) throw new IllegalArgumentException("id must be > 0");
        long publicId = feistel.scramble(id);
        String code = Base62.encode(publicId);
        return leftPad(code, minLen);
    }

    public long decodeToId(String code) {
        if (code == null || code.isBlank()) throw new IllegalArgumentException("code is blank");
        String trimmed = trimLeadingZeros(code);
        long publicId = Base62.decode(trimmed);
        long id = feistel.unscramble(publicId);
        if (id <= 0) throw new IllegalArgumentException("decoded id invalid");
        return id;
    }

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