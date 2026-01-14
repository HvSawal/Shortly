package dev.hvsawal.shortener.configuration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "shortener.code.v2")
public record CodeV2Props(
        boolean enabled,
        String prefix,
        int minLength,
        int maxLength,
        long startId,
        String key
) {}
