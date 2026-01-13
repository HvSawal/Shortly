package dev.hvsawal.shortener.service;

import dev.hvsawal.shortener.dto.ShortenUrlResponse;

public interface ShortUrlService {
    ShortenUrlResponse create(String url, boolean previewEnabled);
    ShortenUrlResponse getMetadata(String code);
    Resolved resolveForRedirect(String code);

    record Resolved(long id, String originalUrl, boolean previewEnabled, java.time.OffsetDateTime expiresAt) {}
}