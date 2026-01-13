package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;

public final class ServiceUnavailableException extends ShortenerException {
    public ServiceUnavailableException(String message) {
        super(ErrorCode.SERVICE_UNAVAILABLE, message);
    }
}
