package dev.hvsawal.shortener.configuration;

import dev.hvsawal.shortener.core.CodeCodec;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(ShortenerConfigurationProperties.class)
public class AppConfiguration {

    @Bean
    public CodeCodec codeCodec(ShortenerConfigurationProperties props) {
        var s = props.scramble();
        return new CodeCodec(s.key(), s.rounds(), s.minLen());
    }
}
