package dev.hvsawal.shortener.core;

import dev.hvsawal.shortener.support.errors.InvalidUrlException;

import java.net.IDN;
import java.net.URI;

public final class UrlNormalizer {
    private UrlNormalizer() {}

    public static String normalize(String input) {
        if (input == null) throw new InvalidUrlException("URL is required");
        String raw = input.trim();
        if (raw.isEmpty()) throw new InvalidUrlException("URL is required");
        if (raw.length() > 4096) throw new InvalidUrlException("URL too long");

        URI uri;
        try {
            uri = URI.create(raw);
        } catch (Exception e) {
            throw new InvalidUrlException("Invalid URL format");
        }

        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new InvalidUrlException("URL scheme must be http or https");
        }
        if (uri.getHost() == null || uri.getHost().isBlank()) {
            throw new InvalidUrlException("URL must be absolute and include a host");
        }

        // Normalize host to ASCII (handles international domains)
        String hostAscii = IDN.toASCII(uri.getHost());

        // Rebuild a clean URI (keeps path/query; drops user-info for safety)
        try {
            URI clean = new URI(
                    scheme.toLowerCase(),
                    null,
                    hostAscii,
                    uri.getPort(),
                    uri.getRawPath(),
                    uri.getRawQuery(),
                    null
            );
            return clean.toASCIIString();
        } catch (Exception e) {
            throw new InvalidUrlException("Invalid URL");
        }
    }
}
