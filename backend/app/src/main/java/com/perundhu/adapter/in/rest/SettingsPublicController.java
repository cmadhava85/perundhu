package com.perundhu.adapter.in.rest;

import java.util.HashMap;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.SystemSettingsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Public API for accessing application settings and feature flags.
 * These endpoints are accessible without authentication.
 */
@RestController
@RequestMapping("/v1/settings")
@RequiredArgsConstructor
@Slf4j
public class SettingsPublicController {

    private final SystemSettingsService settingsService;

    /**
     * Get feature flag status by name. This is a public endpoint for frontend
     * to check if a feature is enabled.
     * 
     * @param feature The feature flag name (e.g., enableAddStops, enableShareRoute)
     * @return Map with feature name as key and boolean status as value
     * 
     *         Example: GET
     *         /api/v1/settings/feature-enabled?feature=enableShareRoute
     *         Response: {"enableShareRoute": true}
     */
    @GetMapping("/feature-enabled")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Boolean>> isFeatureEnabled(@RequestParam String feature) {
        log.debug("Public feature flag request for: {}", feature);

        boolean enabled = settingsService.isFeatureEnabled(feature);
        Map<String, Boolean> response = new HashMap<>();
        response.put(feature, enabled);

        return ResponseEntity.ok(response);
    }

    /**
     * Get ALL feature flags in one call (bulk endpoint).
     * This is more efficient than calling feature-enabled multiple times.
     * 
     * @return Map with all feature flag names as keys and boolean statuses as
     *         values
     * 
     *         Example: GET /api/v1/settings/feature-flags
     *         Response: {"enableAddStops": true, "enableShareRoute": false,
     *         "enableImageContribution": true, ...}
     */
    @GetMapping("/feature-flags")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Boolean>> getAllFeatureFlags() {
        log.debug("Public bulk feature flags request");

        Map<String, Boolean> allFlags = settingsService.getFeatureFlags();

        log.debug("Returning {} feature flags", allFlags.size());
        return ResponseEntity.ok(allFlags);
    }

    /**
     * Get multiple feature flags at once for efficiency.
     * 
     * @param features Comma-separated list of feature flag names
     * @return Map with feature names as keys and boolean statuses as values
     * 
     *         Example: GET
     *         /api/v1/settings/features?features=enableAddStops,enableShareRoute
     *         Response: {"enableAddStops": true, "enableShareRoute": false}
     */
    @GetMapping("/features")
    @PreAuthorize("permitAll()")
    public ResponseEntity<Map<String, Boolean>> getFeatures(@RequestParam(required = false) String features) {
        log.debug("Public features request: {}", features);

        Map<String, Boolean> response = new HashMap<>();

        if (features != null && !features.isBlank()) {
            String[] featureNames = features.split(",");
            for (String feature : featureNames) {
                String trimmed = feature.trim();
                if (!trimmed.isEmpty()) {
                    response.put(trimmed, settingsService.isFeatureEnabled(trimmed));
                }
            }
        }

        return ResponseEntity.ok(response);
    }
}
