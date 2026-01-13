package dev.hvsawal.shortener.core;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class CodeCodecTest {

    @Test
    void roundTrip_encode_decode() {
        CodeCodec codec = new CodeCodec("dev-key-0123456789abcdef", 5, 6);

        for (long id = 1; id <= 10_000; id += 137) {
            String code = codec.encodeId(id);
            long decoded = codec.decodeToId(code);
            assertEquals(id, decoded, "id should round-trip");
            assertTrue(code.length() >= 6);
        }
    }

    @Test
    void sequential_ids_do_not_look_sequential() {
        CodeCodec codec = new CodeCodec("dev-key-0123456789abcdef", 5, 6);

        String c1 = codec.encodeId(1);
        String c2 = codec.encodeId(2);
        String c3 = codec.encodeId(3);

        assertNotEquals(c1, c2);
        assertNotEquals(c2, c3);
        assertNotEquals(c1, c3);
    }
}
