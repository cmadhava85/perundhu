package com.perundhu.adapter.in.rest;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Accepts unhandled frontend errors from the React ErrorBoundary and logs them
 * to Cloud Logging so they are visible in GCP Error Reporting.
 *
 * <p>This endpoint is intentionally lightweight: it logs and returns 204, never
 * writes to the database and has no side effects. Rate limiting is already
 * applied at the filter layer (RateLimitingFilter on /api/*).
 */
@RestController
@RequestMapping("/v1/client-errors")
@Slf4j
public class ClientErrorController {

    @PostMapping
    public ResponseEntity<Void> report(@Valid @RequestBody ClientErrorRequest body) {
        // Log with structured fields so GCP Error Reporting picks it up via the
        // "httpRequest.status >= 500" or "severity=ERROR" heuristic.
        log.error(
            "FRONTEND_ERROR component={} message={} version={} url={}",
            sanitize(body.component()),
            sanitize(body.message()),
            sanitize(body.appVersion()),
            sanitize(body.url())
        );
        return ResponseEntity.noContent().build();
    }

    /** Strip newlines to prevent log-injection. */
    private static String sanitize(String value) {
        if (value == null) return "";
        return value.replace('\n', ' ').replace('\r', ' ');
    }

    public record ClientErrorRequest(
        @NotBlank @Size(max = 500) String message,
        @Size(max = 200) String component,
        @Size(max = 4000) String stack,
        @Size(max = 500) String url,
        @Size(max = 50) String appVersion
    ) {}
}
