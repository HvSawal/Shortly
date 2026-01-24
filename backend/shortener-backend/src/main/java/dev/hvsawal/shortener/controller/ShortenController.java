package dev.hvsawal.shortener.controller;

import dev.hvsawal.shortener.dto.ShortenRequest;
import dev.hvsawal.shortener.dto.ShortenUrlResponse;
import dev.hvsawal.shortener.service.ShortUrlService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/shorten")
@Tag(name = "Shorten", description = "Create short URLs and fetch metadata for existing codes.")
public class ShortenController {

    private final ShortUrlService service;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(
            summary = "Create a short URL",
            description = "Creates (or returns an existing) shortened URL for the given long URL. " +
                    "Optionally enables preview mode if `preview=true`."
    )
    public ShortenUrlResponse create(@Valid @RequestBody ShortenRequest req) {
        boolean preview = req.preview() != null && req.preview();
        return service.create(req.url(), preview);
    }

    @GetMapping("/{code}")
    @Operation(
            summary = "Get metadata for a short code",
            description = "Returns metadata for an existing short code (original URL, timestamps, click count, etc.)."
    )
    public ShortenUrlResponse getMetadata(@PathVariable String code) {
        return service.getMetadata(code);
    }

}
