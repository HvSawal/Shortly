package dev.hvsawal.shortener.dto;

import java.time.OffsetDateTime;

public record ShortenUrlResponse(
        String code,
        String shortUrl,
        String originalUrl,
        boolean previewEnabled,
        OffsetDateTime createdAt,
        OffsetDateTime expiresAt,
        Long clickCount
) {}
