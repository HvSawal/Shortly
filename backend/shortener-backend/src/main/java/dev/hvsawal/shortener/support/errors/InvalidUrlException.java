package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;

public final class InvalidUrlException extends ShortenerException {
    public InvalidUrlException(String message) {
        super(ErrorCode.INVALID_URL, message);
    }
}