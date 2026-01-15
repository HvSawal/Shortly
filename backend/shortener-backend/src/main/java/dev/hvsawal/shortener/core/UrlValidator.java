package dev.hvsawal.shortener.core;

import dev.hvsawal.shortener.support.errors.InvalidUrlException;

import java.net.IDN;
import java.net.InetAddress;
import java.net.URI;
import java.util.Set;

public final class UrlValidator {
    private UrlValidator() {}

    private static final Set<String> ALLOWED_SCHEMES = Set.of("http", "https");

    /**
     * Strict-ish "public URL" policy:
     * - scheme must be http/https
     * - host must be present
     * - host must be localhost OR IP OR contain a dot with a plausible TLD label
     */
    public static void validateStrict(URI uri, boolean allowLocalhost) {

        String scheme = uri.getScheme();
        if (scheme == null || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
            throw new InvalidUrlException("URL scheme must be http or https");
        }

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new InvalidUrlException("URL must be absolute and include a host");
        }

        String asciiHost = IDN.toASCII(host);
        if (allowLocalhost && "localhost".equalsIgnoreCase(asciiHost)) {
            return;
        }

        // Accept IPs (v4/v6)
        if (isIpAddress(asciiHost)) {
            return;
        }

        // Require at least one dot for public domains
        if (!asciiHost.contains(".")) {
            throw new InvalidUrlException("Host must be a valid public domain");
        }

        // Basic TLD sanity: last label >= 2 chars, alpha only (simple + pragmatic)
        String[] labels = asciiHost.split("\\.");
        String tld = labels[labels.length - 1];
        if (tld.length() < 2 || !tld.chars().allMatch(Character::isLetter)) {
            throw new IllegalArgumentException("Host must have a valid TLD");
        }
    }

    private static boolean isIpAddress(String host) {
        try {
            // InetAddress can resolve names too; we only want literal IPs.
            // If it parses without DNS lookups, it's a literal IP.
            // Heuristic: if contains ':' it's IPv6 literal; if digits/dots IPv4.
            if (host.contains(":")) {
                InetAddress.getByName(host);
                return true;
            }
            if (host.chars().allMatch(c -> Character.isDigit(c) || c == '.')) {
                InetAddress.getByName(host);
                return true;
            }
            return false;
        } catch (Exception e) {
            return false;
        }
    }
}
