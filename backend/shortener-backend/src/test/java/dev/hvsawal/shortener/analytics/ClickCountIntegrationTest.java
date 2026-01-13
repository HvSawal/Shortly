package dev.hvsawal.shortener.analytics;

import dev.hvsawal.shortener.dto.ShortenRequest;
import dev.hvsawal.shortener.dto.ShortenUrlResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import org.junit.jupiter.api.BeforeEach;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.io.IOException;
import java.net.HttpURLConnection;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
public class ClickCountIntegrationTest {

    static class NoRedirectRequestFactory extends SimpleClientHttpRequestFactory {
        @Override
        protected void prepareConnection(HttpURLConnection connection, String httpMethod) throws IOException {
            super.prepareConnection(connection, httpMethod);
            connection.setInstanceFollowRedirects(false);
        }
    }

    @Container
    static PostgreSQLContainer<?> pg = new PostgreSQLContainer<>("postgres:16-alpine")
            .withDatabaseName("shortener")
            .withUsername("shortener")
            .withPassword("shortener");

    @DynamicPropertySource
    static void props(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url", pg::getJdbcUrl);
        r.add("spring.datasource.username", pg::getUsername);
        r.add("spring.datasource.password", pg::getPassword);

        r.add("shortener.public-base-url", () -> "http://localhost");
        r.add("shortener.scramble.key", () -> "test-scramble-key-0123456789");
        r.add("shortener.scramble.rounds", () -> 5);
        r.add("shortener.scramble.min-len", () -> 6);
        r.add("shortener.expiration-years", () -> 2);

        r.add("shortener.clickcount.enabled", () -> true);
        r.add("shortener.clickcount.flush-interval-ms", () -> 60_000); // disable auto flush for test determinism
    }

    @Autowired
    TestRestTemplate rest;

    @Autowired
    InMemoryBatchedClickTracker tracker;

    @BeforeEach
    void disableRedirects() {
        rest.getRestTemplate().setRequestFactory(new NoRedirectRequestFactory());
    }

    @Test
    void redirect_records_and_flush_updates_click_count() {
        // create
        ResponseEntity<ShortenUrlResponse> created = rest.postForEntity(
                "/api/v1/shorten",
                new ShortenRequest("https://example.com/x", false),
                ShortenUrlResponse.class
        );
        String code = created.getBody().code();

        // hit redirect 5 times (GET)
        for (int i = 0; i < 5; i++) {
            rest.exchange("/" + code, HttpMethod.GET, HttpEntity.EMPTY, String.class);
        }

        // force flush now (calls repo increment)
        tracker.scheduledFlush();

        // metadata should show 5
        ShortenUrlResponse meta = rest.getForObject("/api/v1/shorten/" + code, ShortenUrlResponse.class);
        assertThat(meta.clickCount()).isEqualTo(5L);
    }
}
