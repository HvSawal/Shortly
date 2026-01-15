package dev.hvsawal.shortener.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
public class RootController {
    @GetMapping("/")
    public Map<String, String> root() {
        return Map.of(
                "service", "url-shortener",
                "health", "/actuator/health",
                "docs", "/swagger-ui/index.html"
        );
    }
}
