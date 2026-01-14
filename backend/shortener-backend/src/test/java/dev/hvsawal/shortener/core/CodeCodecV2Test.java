package dev.hvsawal.shortener.core;

import dev.hvsawal.shortener.configuration.CodeV2Props;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class CodeCodecV2Test {

    @Test
    void v1_for_ids_before_startId_and_v2_after() {
        CodeV2Props v2 = new CodeV2Props(true, "_", 5, 10, 100L, "dev-key");
        CodeCodec codec = new CodeCodec("dev-key", 6, 1, v2);

        String oldCode = codec.encodeId(42L);
        assertThat(oldCode).doesNotStartWith("_");
        assertThat(codec.decodeToId(oldCode)).isEqualTo(42L);

        String newCode = codec.encodeId(100L);
        assertThat(newCode).startsWith("_");
        assertThat(codec.decodeToId(newCode)).isEqualTo(100L);
        assertThat(newCode.length()).isEqualTo(1 + 5); // prefix + minLen
    }
}
