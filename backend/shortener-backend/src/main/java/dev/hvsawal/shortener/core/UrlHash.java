package dev.hvsawal.shortener.core;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public final class UrlHash {
    private UrlHash() {
    }

    /**
     * SHA-256 hex(normalizedUrl + "|" + previewEnabled).
     */
    public static String sha256Hex(String normalizedUrl, boolean previewEnabled) {
        String input = normalizedUrl + "|" + previewEnabled;
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            return toHex(digest);
        } catch (Exception e) {
            throw new IllegalStateException("SHA-256 not available", e);
        }
    }

    private static String toHex(byte[] bytes) {
        char[] out = new char[bytes.length * 2];
        char[] alphabet = "0123456789abcdef".toCharArray();
        for (int i = 0; i < bytes.length; i++) {
            int v = bytes[i] & 0xFF;
            out[i * 2] = alphabet[v >>> 4];
            out[i * 2 + 1] = alphabet[v & 0x0F];
        }
        return new String(out);
    }
}
