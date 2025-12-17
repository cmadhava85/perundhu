package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.SystemSettingsService;
import com.perundhu.domain.model.SystemSetting;

import lombok.RequiredArgsConstructor;

/**
 * REST controller for managing system settings and feature flags.
 * Only accessible by admin users.
 */
@RestController
@RequestMapping("/api/admin/settings")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class SettingsAdminController {

  private static final Logger log = LoggerFactory.getLogger(SettingsAdminController.class);

  private final SystemSettingsService settingsService;

  /**
   * Get all system settings
   * 
   * @return List of all settings
   */
  @GetMapping
  public ResponseEntity<List<SystemSetting>> getAllSettings() {
    log.info("Request to get all system settings");
    return ResponseEntity.ok(settingsService.getAllSettings());
  }

  /**
   * Get all settings as a key-value map
   * 
   * @return Map of setting key to value
   */
  @GetMapping("/map")
  public ResponseEntity<Map<String, String>> getAllSettingsAsMap() {
    log.info("Request to get all settings as map");
    return ResponseEntity.ok(settingsService.getAllSettingsAsMap());
  }

  /**
   * Get all feature flags in frontend-compatible format
   * 
   * @return Map of feature flag name to boolean value
   */
  @GetMapping("/feature-flags")
  public ResponseEntity<Map<String, Boolean>> getFeatureFlags() {
    log.info("Request to get feature flags");
    return ResponseEntity.ok(settingsService.getFeatureFlags());
  }

  /**
   * Get settings by category
   * 
   * @param category The category name (features, security, system)
   * @return List of settings in the category
   */
  @GetMapping("/category/{category}")
  public ResponseEntity<List<SystemSetting>> getSettingsByCategory(@PathVariable String category) {
    log.info("Request to get settings for category: {}", category);
    return ResponseEntity.ok(settingsService.getSettingsByCategory(category));
  }

  /**
   * Get a specific setting by key
   * 
   * @param key The setting key
   * @return The setting if found
   */
  @GetMapping("/key/{key}")
  public ResponseEntity<SystemSetting> getSettingByKey(@PathVariable String key) {
    log.info("Request to get setting by key: {}", key);
    return settingsService.getSetting(key)
        .map(ResponseEntity::ok)
        .orElse(ResponseEntity.notFound().build());
  }

  /**
   * Update a single setting
   * 
   * @param key         The setting key
   * @param requestBody The new value
   * @return The updated setting
   */
  @PutMapping("/key/{key}")
  public ResponseEntity<?> updateSetting(
      @PathVariable String key,
      @RequestBody Map<String, String> requestBody) {
    try {
      String value = requestBody.get("value");
      if (value == null) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Value is required"));
      }

      log.info("Request to update setting: {} = {}", key, value);
      SystemSetting updated = settingsService.updateSetting(key, value);

      return ResponseEntity.ok(updated);
    } catch (IllegalArgumentException e) {
      log.warn("Setting not found: {}", key);
      return ResponseEntity.notFound().build();
    } catch (Exception e) {
      log.error("Error updating setting {}: {}", key, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update setting: " + e.getMessage()));
    }
  }

  /**
   * Update multiple settings at once
   * 
   * @param settings Map of setting key to value
   * @return Success response
   */
  @PutMapping("/bulk")
  public ResponseEntity<Map<String, Object>> updateMultipleSettings(
      @RequestBody Map<String, String> settings) {
    try {
      log.info("Request to update {} settings in bulk", settings.size());
      settingsService.updateSettings(settings);

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("updatedCount", settings.size());
      response.put("timestamp", LocalDateTime.now());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error updating settings in bulk: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update settings: " + e.getMessage()));
    }
  }

  /**
   * Update feature flags from frontend
   * Accepts feature flags in camelCase format (e.g., enableShareRoute)
   * 
   * @param flags Map of feature flag name to boolean value
   * @return Success response with updated flags
   */
  @PutMapping("/feature-flags")
  public ResponseEntity<Map<String, Object>> updateFeatureFlags(
      @RequestBody Map<String, Boolean> flags) {
    try {
      log.info("Request to update {} feature flags", flags.size());
      settingsService.updateFeatureFlags(flags);

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("updatedCount", flags.size());
      response.put("flags", settingsService.getFeatureFlags());
      response.put("timestamp", LocalDateTime.now());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error updating feature flags: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to update feature flags: " + e.getMessage()));
    }
  }

  /**
   * Create a new setting (for custom settings)
   * 
   * @param requestBody The setting details
   * @return The created setting
   */
  @PostMapping
  public ResponseEntity<?> createSetting(@RequestBody CreateSettingRequest requestBody) {
    try {
      log.info("Request to create new setting: {}", requestBody.getKey());

      if (requestBody.getKey() == null || requestBody.getKey().isBlank()) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Setting key is required"));
      }

      SystemSetting created = settingsService.createSetting(
          requestBody.getKey(),
          requestBody.getValue(),
          requestBody.getCategory() != null ? requestBody.getCategory() : "custom",
          requestBody.getDescription());

      return ResponseEntity.ok(created);
    } catch (IllegalArgumentException e) {
      log.warn("Setting already exists: {}", requestBody.getKey());
      return ResponseEntity.badRequest()
          .body(Map.of("error", e.getMessage()));
    } catch (Exception e) {
      log.error("Error creating setting: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to create setting: " + e.getMessage()));
    }
  }

  /**
   * Delete a setting (only for custom settings)
   * 
   * @param key The setting key
   * @return No content response
   */
  @DeleteMapping("/key/{key}")
  public ResponseEntity<?> deleteSetting(@PathVariable String key) {
    try {
      log.info("Request to delete setting: {}", key);

      // Prevent deletion of system settings
      if (key.startsWith("feature.") || key.startsWith("security.") || key.startsWith("system.")) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Cannot delete system settings. Use reset instead."));
      }

      settingsService.deleteSetting(key);
      return ResponseEntity.noContent().build();
    } catch (Exception e) {
      log.error("Error deleting setting {}: {}", key, e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to delete setting: " + e.getMessage()));
    }
  }

  /**
   * Reset all settings to default values
   * 
   * @return Success response
   */
  @PostMapping("/reset")
  public ResponseEntity<Map<String, Object>> resetToDefaults() {
    try {
      log.info("Request to reset all settings to defaults");
      settingsService.resetToDefaults();

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "All settings reset to defaults");
      response.put("settings", settingsService.getAllSettingsAsMap());
      response.put("timestamp", LocalDateTime.now());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error resetting settings: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to reset settings: " + e.getMessage()));
    }
  }

  /**
   * Reset only feature flags to defaults
   * 
   * @return Success response with updated flags
   */
  @PostMapping("/feature-flags/reset")
  public ResponseEntity<Map<String, Object>> resetFeatureFlagsToDefaults() {
    try {
      log.info("Request to reset feature flags to defaults");
      settingsService.resetFeatureFlagsToDefaults();

      Map<String, Object> response = new HashMap<>();
      response.put("success", true);
      response.put("message", "Feature flags reset to defaults");
      response.put("flags", settingsService.getFeatureFlags());
      response.put("timestamp", LocalDateTime.now());

      return ResponseEntity.ok(response);
    } catch (Exception e) {
      log.error("Error resetting feature flags: {}", e.getMessage(), e);
      return ResponseEntity.internalServerError()
          .body(Map.of("error", "Failed to reset feature flags: " + e.getMessage()));
    }
  }

  /**
   * Check if a feature is enabled (public endpoint for frontend)
   * This is a non-admin endpoint for checking feature availability
   * 
   * @param feature The feature key
   * @return Boolean indicating if the feature is enabled
   */
  @GetMapping("/feature-enabled")
  @PreAuthorize("permitAll()")
  public ResponseEntity<Map<String, Boolean>> isFeatureEnabled(@RequestParam String feature) {
    boolean enabled = settingsService.isFeatureEnabled(feature);
    return ResponseEntity.ok(Map.of(feature, enabled));
  }

  /**
   * Request class for creating new settings
   */
  public static class CreateSettingRequest {
    private String key;
    private String value;
    private String category;
    private String description;

    public String getKey() {
      return key;
    }

    public void setKey(String key) {
      this.key = key;
    }

    public String getValue() {
      return value;
    }

    public void setValue(String value) {
      this.value = value;
    }

    public String getCategory() {
      return category;
    }

    public void setCategory(String category) {
      this.category = category;
    }

    public String getDescription() {
      return description;
    }

    public void setDescription(String description) {
      this.description = description;
    }
  }
}
