package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;

public final class CodeNotFoundException extends ShortenerException {
    public CodeNotFoundException(String message) {
        super(ErrorCode.CODE_NOT_FOUND, message);
    }
}
