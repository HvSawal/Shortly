package dev.hvsawal.shortener.domain;

public enum ErrorCode {
    INVALID_URL,
    CODE_NOT_FOUND,
    URL_EXPIRED,
    RATE_LIMITED,
    SERVICE_UNAVAILABLE,
    INTERNAL_ERROR
}
