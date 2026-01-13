package dev.hvsawal.shortener.controller;

import dev.hvsawal.shortener.dto.ShortenRequest;
import dev.hvsawal.shortener.dto.ShortenUrlResponse;
import dev.hvsawal.shortener.service.ShortUrlService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/shorten")
public class ShortenController {

    private final ShortUrlService service;

    public ShortenController(ShortUrlService service) {
        this.service = service;
    }

    @PostMapping
    public ShortenUrlResponse create(@Valid @RequestBody ShortenRequest req) {
        boolean preview = req.preview() != null && req.preview();
        return service.create(req.url(), preview);
    }

    @GetMapping("/{code}")
    public ShortenUrlResponse getMetadata(@PathVariable String code) {
        return service.getMetadata(code);
    }
}
