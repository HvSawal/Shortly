package dev.hvsawal.shortener.core;

import dev.hvsawal.shortener.support.errors.InvalidUrlException;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class UrlNormalizerTest {

    @Test
    void rejects_single_label_host() {
        assertThatThrownBy(() -> UrlNormalizer.normalize("http://asdasd"))
                .isInstanceOf(InvalidUrlException.class);
    }
}
