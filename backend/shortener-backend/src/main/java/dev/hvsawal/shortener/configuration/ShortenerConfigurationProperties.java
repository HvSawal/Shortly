package dev.hvsawal.shortener.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "shortener")
public record ShortenerConfigurationProperties(
        String publicBaseUrl,
        Scramble scramble,
        int expirationYears,
        Cache cache,
        Bulkhead bulkhead,
        Ratelimit ratelimit,
        Clickcount clickcount
) {
    public record Scramble(String key, int rounds, int minLen) {}
    public record Cache(int resolveTtlSeconds, int maxSize) {}
    public record Bulkhead(int dbPermits, AcquireTimeoutMs acquireTimeoutMs) {
        public record AcquireTimeoutMs(int shorten, int resolve) {}
    }
    public record Ratelimit(int shortenPerMinute) {}
    public record Clickcount(boolean enabled, int flushIntervalMs, int maxBufferEntries) {}
}
