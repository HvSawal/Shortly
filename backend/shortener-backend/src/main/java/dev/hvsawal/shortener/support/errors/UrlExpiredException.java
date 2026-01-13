package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;

public final class UrlExpiredException extends ShortenerException {
    public UrlExpiredException(String message) {
        super(ErrorCode.URL_EXPIRED, message);
    }
}
