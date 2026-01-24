package dev.hvsawal.shortener.controller;

import dev.hvsawal.shortener.analytics.ClickTracker;
import dev.hvsawal.shortener.service.ShortUrlService;
import io.swagger.v3.oas.annotations.Hidden;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;

@RestController
@RequiredArgsConstructor
@Hidden
public class RedirectController {

    private final ShortUrlService service;
    private final ClickTracker clickTracker;

    @GetMapping("/{code}")
    public ResponseEntity<?> redirect(@PathVariable String code) {
        var resolved = service.resolveForRedirect(code);
        clickTracker.record(resolved.id());

        if (resolved.previewEnabled()) {
            String html = interstitialHtml(resolved.originalUrl());
            return ResponseEntity.ok()
                    .contentType(MediaType.TEXT_HTML)
                    .body(html);
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setLocation(URI.create(resolved.originalUrl()));
        return new ResponseEntity<>(headers, HttpStatus.FOUND);
    }

    private static String interstitialHtml(String target) {
        String escaped = target.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace("\"", "&quot;");
        return """
        <!doctype html>
        <html lang="en">
          <head>
            <meta charset="utf-8"/>
            <meta name="viewport" content="width=device-width,initial-scale=1"/>
            <title>Leaving this site</title>
            <style>
              body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:720px;margin:48px auto;padding:0 16px}
              .card{border:1px solid #e5e7eb;border-radius:14px;padding:18px}
              .muted{color:#6b7280;font-size:14px}
              a.btn{display:inline-block;margin-top:12px;padding:10px 14px;border-radius:12px;background:#111827;color:#fff;text-decoration:none}
              code{word-break:break-all}
            </style>
          </head>
          <body>
            <h2>You are leaving this site</h2>
            <div class="card">
              <div class="muted">Destination</div>
              <code>%s</code>
              <br/>
              <a class="btn" href="%s" rel="noreferrer noopener">Continue</a>
            </div>
          </body>
        </html>
        """.formatted(escaped, escaped);
    }
}
