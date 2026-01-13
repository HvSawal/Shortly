package dev.hvsawal.shortener.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ShortenRequest(
        @NotBlank(message = "url is required")
        @Size(max = 4096, message = "url too long")
        String url,
        Boolean preview
) {}