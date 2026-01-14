package dev.hvsawal.shortener.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;

import java.time.OffsetDateTime;

@Data
@Entity
@Table(name = "short_url")
@NoArgsConstructor
public class ShortUrlEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "original_url", nullable = false, columnDefinition = "text")
    @NotNull
    private String originalUrl;

    @Column(name = "preview_enabled", nullable = false)
    @NotNull
    private boolean previewEnabled;

    @Column(name = "created_at", nullable = false)
    @NotNull
    private OffsetDateTime createdAt;

    @Column(name = "expires_at", nullable = false)
    @NotNull
    private OffsetDateTime expiresAt;

    @Column(name = "click_count", nullable = false)
    @NotNull
    private long clickCount;

    @Column(name = "url_hash", nullable = false, length = 64)
    @NotNull
    private String urlHash;

    public ShortUrlEntity(String originalUrl, boolean previewEnabled, OffsetDateTime createdAt, OffsetDateTime expiresAt, String urlHash) {
        this.originalUrl = originalUrl;
        this.previewEnabled = previewEnabled;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.clickCount = 0L;
        this.urlHash = urlHash;
    }
}
