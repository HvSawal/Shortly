package dev.hvsawal.shortener.core;

import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class Feistel64 {
    private final int rounds;
    private final int[] roundKeys;

    public Feistel64(String secretKey, int rounds) {
        if (secretKey == null || secretKey.isBlank()) {
            throw new IllegalStateException("SHORTENER_SCRAMBLE_KEY must be set (non-blank)");
        }
        if (rounds < 3 || rounds > 10) throw new IllegalArgumentException("rounds must be in [3..10]");
        this.rounds = rounds;
        this.roundKeys = deriveRoundKeys(secretKey, rounds);
    }

    public long scramble(long x) {
        return feistel(x);
    }

    public long unscramble(long x) {
        return feistelInverse(x);
    }

    private long feistel(long input) {
        int left = (int) (input >>> 32);
        int right = (int) input;

        for (int i = 0; i < rounds; i++) {
            int newLeft = right;
            int newRight = left ^ roundFunction(right, roundKeys[i]);
            left = newLeft;
            right = newRight;
        }
        return (toUnsignedLong(left) << 32) | toUnsignedLong(right);
    }

    private long feistelInverse(long input) {
        int left = (int) (input >>> 32);
        int right = (int) input;

        for (int i = rounds - 1; i >= 0; i--) {
            int newRight = left;
            int newLeft = right ^ roundFunction(left, roundKeys[i]);
            left = newLeft;
            right = newRight;
        }
        return (toUnsignedLong(left) << 32) | toUnsignedLong(right);
    }

    private static long toUnsignedLong(int x) {
        return x & 0xFFFF_FFFFL;
    }

    private static int roundFunction(int r, int k) {
        int x = r ^ k;
        x *= 0x9E3779B9;
        x = Integer.rotateLeft(x, 5);
        x *= 0x85EBCA6B;
        x ^= (x >>> 16);
        return x;
    }

    private static int[] deriveRoundKeys(String secretKey, int rounds) {
        try {
            MessageDigest sha256 = MessageDigest.getInstance("SHA-256");
            byte[] digest = sha256.digest(secretKey.getBytes(StandardCharsets.UTF_8));
            ByteBuffer bb = ByteBuffer.wrap(digest);
            int[] keys = new int[rounds];
            for (int i = 0; i < rounds; i++) {
                keys[i] = bb.getInt((i * 4) % (digest.length - 3));
            }
            return keys;
        } catch (Exception e) {
            throw new IllegalStateException("Failed to derive scramble keys", e);
        }
    }
}
