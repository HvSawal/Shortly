package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;

public final class RateLimitedException extends ShortenerException {
    private final int retryAfterSeconds;

    public RateLimitedException(String message, int retryAfterSeconds) {
        super(ErrorCode.RATE_LIMITED, message);
        this.retryAfterSeconds = retryAfterSeconds;
    }

    public int retryAfterSeconds() {
        return retryAfterSeconds;
    }
}
