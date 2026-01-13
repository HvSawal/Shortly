package dev.hvsawal.shortener.api;

import dev.hvsawal.shortener.dto.ShortenRequest;
import dev.hvsawal.shortener.dto.ShortenUrlResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
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
class ShortenerIntegrationTest {

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

        r.add("shortener.public-base-url", () -> "http://localhost"); // not used for absolute assertion
        r.add("shortener.scramble.key", () -> "test-scramble-key-0123456789");
        r.add("shortener.scramble.rounds", () -> 5);
        r.add("shortener.scramble.min-len", () -> 6);
        r.add("shortener.expiration-years", () -> 2);

        // Keep tests deterministic: disable clickcount flush for now
        r.add("shortener.clickcount.enabled", () -> false);
    }

    @Autowired
    TestRestTemplate rest;

    @BeforeEach
    void disableRedirects() {
        rest.getRestTemplate().setRequestFactory(new NoRedirectRequestFactory());
    }

    @Test
    void create_metadata_redirect_flow() {
        // create
        var req = new ShortenRequest("https://example.com/a?b=1", false);
        ResponseEntity<ShortenUrlResponse> created = rest.postForEntity("/api/v1/shorten", req, ShortenUrlResponse.class);
        assertThat(created.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(created.getBody()).isNotNull();
        String code = created.getBody().code();
        assertThat(code).isNotBlank();
        assertThat(code.length()).isGreaterThanOrEqualTo(6);

        // metadata
        ResponseEntity<ShortenUrlResponse> meta = rest.getForEntity("/api/v1/shorten/" + code, ShortenUrlResponse.class);
        assertThat(meta.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(meta.getBody()).isNotNull();
        assertThat(meta.getBody().originalUrl()).isEqualTo("https://example.com/a?b=1");

        // redirect
        HttpHeaders h = new HttpHeaders();
        HttpEntity<Void> entity = new HttpEntity<>(h);
        ResponseEntity<String> redir = rest.exchange("/" + code, HttpMethod.GET, entity, String.class);
        assertThat(redir.getStatusCode()).isEqualTo(HttpStatus.FOUND);
        assertThat(redir.getHeaders().getLocation()).isNotNull();
        assertThat(redir.getHeaders().getLocation().toString()).isEqualTo("https://example.com/a?b=1");
    }

    @Test
    void invalid_url_returns_400_problem_detail() {
        var req = new ShortenRequest("javascript:alert(1)", false);
        ResponseEntity<String> res = rest.postForEntity("/api/v1/shorten", req, String.class);
        assertThat(res.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(res.getBody()).contains("INVALID_URL");
    }
}
