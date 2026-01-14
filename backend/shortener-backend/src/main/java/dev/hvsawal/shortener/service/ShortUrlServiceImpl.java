package dev.hvsawal.shortener.service;

import dev.hvsawal.shortener.configuration.CacheConfiguration;
import dev.hvsawal.shortener.configuration.ShortenerConfigurationProperties;
import dev.hvsawal.shortener.core.CodeCodec;
import dev.hvsawal.shortener.core.UrlHash;
import dev.hvsawal.shortener.core.UrlNormalizer;
import dev.hvsawal.shortener.domain.ShortUrlEntity;
import dev.hvsawal.shortener.dto.ShortenUrlResponse;
import dev.hvsawal.shortener.repository.ShortUrlRepository;
import dev.hvsawal.shortener.support.errors.CodeNotFoundException;
import dev.hvsawal.shortener.support.errors.RateLimitedException;
import dev.hvsawal.shortener.support.errors.ServiceUnavailableException;
import dev.hvsawal.shortener.support.errors.UrlExpiredException;
import dev.hvsawal.shortener.support.resilience.DbBulkhead;
import dev.hvsawal.shortener.support.resilience.SimpleRateLimiter;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.dao.CannotAcquireLockException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.TransientDataAccessException;
import org.springframework.jdbc.CannotGetJdbcConnectionException;
import org.springframework.retry.annotation.Backoff;
import org.springframework.retry.annotation.Retryable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Optional;

@Service
public class ShortUrlServiceImpl implements ShortUrlService {

    private final ShortUrlRepository repo;
    private final CodeCodec codec;
    private final ShortenerConfigurationProperties props;
    private final DbBulkhead bulkhead;
    private final SimpleRateLimiter rateLimiter;

    public ShortUrlServiceImpl(ShortUrlRepository repo, CodeCodec codec, ShortenerConfigurationProperties props,
                               DbBulkhead bulkhead, SimpleRateLimiter rateLimiter) {
        this.repo = repo;
        this.codec = codec;
        this.props = props;
        this.bulkhead = bulkhead;
        this.rateLimiter = rateLimiter;
    }

    @Override
    @Transactional
    @Retryable(
            retryFor = {TransientDataAccessException.class, CannotGetJdbcConnectionException.class, CannotAcquireLockException.class},
            maxAttempts = 3,
            backoff = @Backoff(delay = 50, maxDelay = 400, multiplier = 3, random = true)
    )
    public ShortenUrlResponse create(String url, boolean previewEnabled) {
        if (!rateLimiter.tryConsume()) {
            throw new RateLimitedException("Rate limit exceeded. Try again soon.", rateLimiter.retryAfterSeconds());
        }

        try (var permit = bulkhead.tryAcquireShorten()) {
            if (!permit.acquired()) {
                throw new RateLimitedException("System is busy. Try again soon.", 1);
            }

            String normalized = UrlNormalizer.normalize(url);

            // Option A dedup key (same normalized url + previewEnabled => same urlHash)
            String urlHash = UrlHash.sha256Hex(normalized, previewEnabled);

            // 1) Fast path: already exists -> return same code
            Optional<ShortUrlEntity> existing = repo.findByUrlHash(urlHash);
            if (existing.isPresent()) {
                ShortUrlEntity e = existing.get();
                String code = codec.encodeId(e.getId());
                // createdNew = false (or whatever your boolean means)
                return toResponse(e, code, props.publicBaseUrl(), false);
            }

            // 2) Insert new
            OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
            OffsetDateTime expires = now.plusYears(props.expirationYears());

            try {
                ShortUrlEntity saved = repo.save(
                        new ShortUrlEntity(
                                normalized,
                                previewEnabled,
                                now,
                                expires,
                                urlHash
                        )
                );

                String code = codec.encodeId(saved.getId());
                return toResponse(saved, code, props.publicBaseUrl(), true);

            } catch (DataIntegrityViolationException e) {
                // Race: another request inserted same urlHash between our SELECT and INSERT.
                // Return the existing row.
                ShortUrlEntity winner = repo.findByUrlHash(urlHash)
                        .orElseThrow(() -> e);

                String code = codec.encodeId(winner.getId());
                return toResponse(winner, code, props.publicBaseUrl(), false);
            }
        }
    }

    @Override
    @Transactional(readOnly = true)
    public ShortenUrlResponse getMetadata(String code) {
        long id = decode(code);

        try (var permit = bulkhead.tryAcquireResolve()) {
            if (!permit.acquired()) {
                throw new ServiceUnavailableException("Service overloaded. Please retry.");
            }

            ShortUrlEntity e = repo.findById(id).orElseThrow(() -> new CodeNotFoundException("Code not found"));
            if (isExpired(e.getExpiresAt())) throw new UrlExpiredException("URL is expired");
            String computed = codec.encodeId(e.getId());
            return toResponse(e, computed, props.publicBaseUrl(), false);
        }
    }

    @Override
    @Cacheable(cacheNames = CacheConfiguration.RESOLVE_CACHE, key = "#code")
    @Transactional(readOnly = true)
    @Retryable(
            retryFor = {TransientDataAccessException.class, CannotGetJdbcConnectionException.class},
            maxAttempts = 2,
            backoff = @Backoff(delay = 50, maxDelay = 150, multiplier = 2, random = true)
    )
    public Resolved resolveForRedirect(String code) {
        long id = decode(code);

        try (var permit = bulkhead.tryAcquireResolve()) {
            if (!permit.acquired()) {
                throw new ServiceUnavailableException("Service overloaded. Please retry.");
            }

            ShortUrlEntity e = repo.findById(id).orElseThrow(() -> new CodeNotFoundException("Code not found"));
            if (isExpired(e.getExpiresAt())) throw new UrlExpiredException("URL is expired");

            return new Resolved(e.getId(), e.getOriginalUrl(), e.isPreviewEnabled(), e.getExpiresAt());
        }
    }

    private long decode(String code) {
        try {
            return codec.decodeToId(code);
        } catch (Exception e) {
            // Treat invalid codes as not found (don’t leak details)
            throw new CodeNotFoundException("Code not found");
        }
    }

    private boolean isExpired(OffsetDateTime expiresAt) {
        return expiresAt.isBefore(OffsetDateTime.now(ZoneOffset.UTC));
    }

    private ShortenUrlResponse toResponse(ShortUrlEntity e, String code, String base, boolean omitClickCount) {
        String shortUrl = stripTrailingSlash(base) + "/" + code;
        return new ShortenUrlResponse(
                code,
                shortUrl,
                e.getOriginalUrl(),
                e.isPreviewEnabled(),
                e.getCreatedAt(),
                e.getExpiresAt(),
                omitClickCount ? null : e.getClickCount()
        );
    }

    private static String stripTrailingSlash(String s) {
        if (s == null) return "";
        return s.endsWith("/") ? s.substring(0, s.length() - 1) : s;
    }
}