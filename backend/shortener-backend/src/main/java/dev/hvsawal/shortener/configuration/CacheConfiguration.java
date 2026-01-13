package dev.hvsawal.shortener.configuration;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

@Configuration
public class CacheConfiguration {

    public static final String RESOLVE_CACHE = "resolveByCode";

    @Bean
    public CacheManager cacheManager(ShortenerConfigurationProperties props) {
        var cacheProps = props.cache();
        Caffeine<Object, Object> caffeine = Caffeine.newBuilder()
                .maximumSize(cacheProps.maxSize())
                .expireAfterWrite(Duration.ofSeconds(cacheProps.resolveTtlSeconds()))
                .recordStats();

        var mgr = new CaffeineCacheManager(RESOLVE_CACHE);
        mgr.setCaffeine(caffeine);
        return mgr;
    }
}
