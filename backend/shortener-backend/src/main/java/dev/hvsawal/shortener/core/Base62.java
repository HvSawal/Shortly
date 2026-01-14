package dev.hvsawal.shortener.core;

import java.math.BigInteger;

public final class Base62 {
    private static final char[] ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".toCharArray();
    private static final int BASE = 62;
    private static final BigInteger BI_BASE = BigInteger.valueOf(BASE);
    private static final BigInteger BI_MAX_UNSIGNED = BigInteger.ONE.shiftLeft(64);

    private Base62() {}

    public static String encode(long value) {
        if (value == 0L) return "0";

        StringBuilder sb = new StringBuilder(11);
        long v = value;
        while (Long.compareUnsigned(v, 0L) != 0) {
            int rem = (int) Long.remainderUnsigned(v, BASE);
            sb.append(ALPHABET[rem]);
            v = Long.divideUnsigned(v, BASE);
        }
        return sb.reverse().toString();
    }

    public static String encodeFixed(long value, int length) {
        String s = encode(value);
        if (s.length() > length) return s; // should not happen if value < 62^length
        StringBuilder sb = new StringBuilder(length);
        for (int i = s.length(); i < length; i++) sb.append(ALPHABET[0]); // left pad with '0'-equivalent
        sb.append(s);
        return sb.toString();
    }

    public static long decode(String str) {
        if (str == null || str.isBlank()) throw new IllegalArgumentException("str is blank");

        BigInteger result = BigInteger.ZERO;
        for (int i = 0; i < str.length(); i++) {
            int digit = indexOf(str.charAt(i));
            if (digit < 0) throw new IllegalArgumentException("invalid base62 char: " + str.charAt(i));
            result = result.multiply(BI_BASE).add(BigInteger.valueOf(digit));
        }

        // Ensure it fits into unsigned 64-bit range
        if (result.signum() < 0 || result.compareTo(BI_MAX_UNSIGNED) >= 0) {
            throw new IllegalArgumentException("base62 value out of unsigned 64-bit range");
        }

        return result.longValue(); // two's complement is fine for our usage
    }

    private static int indexOf(char c) {
        if (c >= '0' && c <= '9') return c - '0';
        if (c >= 'A' && c <= 'Z') return 10 + (c - 'A');
        if (c >= 'a' && c <= 'z') return 36 + (c - 'a');
        return -1;
    }
}