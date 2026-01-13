package dev.hvsawal.shortener.support.errors;

import dev.hvsawal.shortener.domain.ErrorCode;
import dev.hvsawal.shortener.support.http.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.dao.DataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ShortenerException.class)
    public ResponseEntity<ProblemDetail> handleShortener(ShortenerException ex, HttpServletRequest req) {
        HttpStatus status = switch (ex.code()) {
            case INVALID_URL -> HttpStatus.BAD_REQUEST;
            case CODE_NOT_FOUND -> HttpStatus.NOT_FOUND;
            case URL_EXPIRED -> HttpStatus.GONE;
            case RATE_LIMITED -> HttpStatus.TOO_MANY_REQUESTS;
            case SERVICE_UNAVAILABLE -> HttpStatus.SERVICE_UNAVAILABLE;
            default -> HttpStatus.INTERNAL_SERVER_ERROR;
        };

        // log (no stack trace for expected domain errors)
        log.warn("Handled shortener error code={} status={} path={} requestId={}",
                ex.code(), status.value(), req.getRequestURI(), MDC.get(RequestIdFilter.MDC_KEY));

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(status, ex.getMessage());
        pd.setTitle(ex.code().name());
        pd.setType(URI.create("urn:shortener:" + ex.code().name()));
        enrich(pd, req, ex.code());

        ResponseEntity.BodyBuilder b = ResponseEntity.status(status);
        if (ex instanceof RateLimitedException rle) {
            b.header("Retry-After", String.valueOf(rle.retryAfterSeconds()));
        }
        return b.body(pd);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ProblemDetail> handleValidation(MethodArgumentNotValidException ex, HttpServletRequest req) {
        Map<String, String> errors = new HashMap<>();
        for (FieldError fe : ex.getBindingResult().getFieldErrors()) {
            errors.put(fe.getField(), fe.getDefaultMessage());
        }

        log.warn("Validation failed path={} requestId={} fieldErrors={}",
                req.getRequestURI(), MDC.get(RequestIdFilter.MDC_KEY), errors);

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Validation failed");
        pd.setTitle(ErrorCode.INVALID_URL.name());
        pd.setType(URI.create("urn:shortener:" + ErrorCode.INVALID_URL.name()));
        enrich(pd, req, ErrorCode.INVALID_URL);
        pd.setProperty("fieldErrors", errors);

        return ResponseEntity.badRequest().body(pd);
    }

    // ✅ DB / JPA / Flyway runtime errors should be 503, not 500
    @ExceptionHandler(DataAccessException.class)
    public ResponseEntity<ProblemDetail> handleDataAccess(DataAccessException ex, HttpServletRequest req) {
        log.error("Data access failure path={} requestId={}", req.getRequestURI(),
                MDC.get(RequestIdFilter.MDC_KEY), ex);

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.SERVICE_UNAVAILABLE,
                "Database unavailable or overloaded. Please retry."
        );
        pd.setTitle(ErrorCode.SERVICE_UNAVAILABLE.name());
        pd.setType(URI.create("urn:shortener:" + ErrorCode.SERVICE_UNAVAILABLE.name()));
        enrich(pd, req, ErrorCode.SERVICE_UNAVAILABLE);

        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body(pd);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ProblemDetail> handleAny(Exception ex, HttpServletRequest req) {
        // ✅ log full stacktrace so we can see the real cause
        log.error("Unhandled exception path={} requestId={}", req.getRequestURI(),
                MDC.get(RequestIdFilter.MDC_KEY), ex);

        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.INTERNAL_SERVER_ERROR, "Unexpected error");
        pd.setTitle(ErrorCode.INTERNAL_ERROR.name());
        pd.setType(URI.create("urn:shortener:" + ErrorCode.INTERNAL_ERROR.name()));
        enrich(pd, req, ErrorCode.INTERNAL_ERROR);
        return ResponseEntity.status(500).body(pd);
    }

    private static void enrich(ProblemDetail pd, HttpServletRequest req, ErrorCode code) {
        pd.setProperty("errorCode", code.name());
        pd.setProperty("path", req.getRequestURI());
        pd.setProperty("timestamp", OffsetDateTime.now().toString());
        pd.setProperty("requestId", MDC.get(RequestIdFilter.MDC_KEY));
    }
}
