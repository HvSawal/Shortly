package dev.hvsawal.shortener.support.resilience;

import dev.hvsawal.shortener.configuration.ShortenerConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.concurrent.atomic.AtomicLong;

@Component
public class SimpleRateLimiter {
    private final long capacity;
    private final AtomicLong tokens;
    private volatile long windowStartMs;

    public SimpleRateLimiter(ShortenerConfigurationProperties props) {
        this.capacity = Math.max(1, props.ratelimit().shortenPerMinute());
        this.tokens = new AtomicLong(capacity);
        this.windowStartMs = System.currentTimeMillis();
    }

    public synchronized boolean tryConsume() {
        long now = System.currentTimeMillis();
        if (now - windowStartMs >= 60_000) {
            windowStartMs = now;
            tokens.set(capacity);
        }
        long t = tokens.get();
        if (t <= 0) return false;
        tokens.decrementAndGet();
        return true;
    }

    public int retryAfterSeconds() {
        long now = System.currentTimeMillis();
        long elapsed = now - windowStartMs;
        long remainingMs = Math.max(0, 60_000 - elapsed);
        return (int) Math.max(1, (remainingMs + 999) / 1000);
    }
}
