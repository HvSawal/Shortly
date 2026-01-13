package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;

public abstract class ShortenerException extends RuntimeException {
    private final ErrorCode code;

    protected ShortenerException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }

    public ErrorCode code() {
        return code;
    }
}
