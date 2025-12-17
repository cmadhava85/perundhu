package com.perundhu.application.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.SystemSetting;
import com.perundhu.domain.port.SystemSettingPort;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for managing system settings including feature flags.
 * Provides CRUD operations and initialization of default settings.
 * Uses SystemSettingPort to follow hexagonal architecture principles.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class SystemSettingsService {

  private final SystemSettingPort settingPort;

  // Default feature flag settings
  private static final Map<String, SettingDefault> DEFAULT_SETTINGS = new HashMap<>();

  static {
    // Contribution method toggles
    DEFAULT_SETTINGS.put("feature.contribution.manual.enabled",
        new SettingDefault("true", "features", "Enable manual route contribution"));
    DEFAULT_SETTINGS.put("feature.contribution.image.enabled",
        new SettingDefault("true", "features", "Enable image-based route contribution"));
    DEFAULT_SETTINGS.put("feature.contribution.paste.enabled",
        new SettingDefault("true", "features", "Enable paste text contribution"));
    DEFAULT_SETTINGS.put("feature.contribution.voice.enabled",
        new SettingDefault("false", "features", "Enable voice input contribution"));

    // UI action toggles
    DEFAULT_SETTINGS.put("feature.share.enabled",
        new SettingDefault("true", "features", "Enable share route functionality"));
    DEFAULT_SETTINGS.put("feature.addStops.enabled",
        new SettingDefault("true", "features", "Enable add stops functionality"));
    DEFAULT_SETTINGS.put("feature.reportIssue.enabled",
        new SettingDefault("true", "features", "Enable report issue functionality"));

    // Other feature toggles
    DEFAULT_SETTINGS.put("feature.socialMedia.enabled",
        new SettingDefault("false", "features", "Enable social media monitoring"));
    DEFAULT_SETTINGS.put("feature.communityRewards.enabled",
        new SettingDefault("false", "features", "Enable community rewards program"));
    DEFAULT_SETTINGS.put("feature.businessPartners.enabled",
        new SettingDefault("false", "features", "Enable business partner integrations"));
    DEFAULT_SETTINGS.put("feature.osmIntegration.enabled",
        new SettingDefault("false", "features", "Enable OpenStreetMap integration"));
    DEFAULT_SETTINGS.put("feature.realTimeUpdates.enabled",
        new SettingDefault("false", "features", "Enable real-time updates"));

    // Security settings
    DEFAULT_SETTINGS.put("security.rateLimiting.enabled",
        new SettingDefault("true", "security", "Enable API rate limiting"));
    DEFAULT_SETTINGS.put("security.maxRequestsPerMinute",
        new SettingDefault("60", "security", "Maximum API requests per minute"));
    DEFAULT_SETTINGS.put("security.autoApproval.enabled",
        new SettingDefault("false", "security", "Enable auto-approval for contributions"));
    DEFAULT_SETTINGS.put("security.requireEmailVerification",
        new SettingDefault("false", "security", "Require email verification for contributions"));

    // System settings
    DEFAULT_SETTINGS.put("system.geminiAi.enabled",
        new SettingDefault("true", "system", "Enable Gemini AI for OCR processing"));
    DEFAULT_SETTINGS.put("system.cacheEnabled",
        new SettingDefault("true", "system", "Enable response caching"));
    DEFAULT_SETTINGS.put("system.maintenanceMode",
        new SettingDefault("false", "system", "Enable maintenance mode"));
  }

  /**
   * Initialize default settings on application startup
   */
  @PostConstruct
  @Transactional
  public void initializeDefaultSettings() {
    log.info("Initializing default system settings");

    DEFAULT_SETTINGS.forEach((key, defaultSetting) -> {
      if (!settingPort.existsBySettingKey(key)) {
        SystemSetting setting = new SystemSetting(
            null,
            key,
            defaultSetting.value(),
            defaultSetting.category(),
            defaultSetting.description(),
            null,
            null);
        settingPort.save(setting);
        log.debug("Created default setting: {} = {}", key, defaultSetting.value());
      }
    });

    log.info("System settings initialization complete");
  }

  /**
   * Get all settings
   */
  @Transactional(readOnly = true)
  public List<SystemSetting> getAllSettings() {
    return settingPort.findAllOrderedByCategoryAndKey();
  }

  /**
   * Get all settings as a map (key -> value)
   */
  @Transactional(readOnly = true)
  public Map<String, String> getAllSettingsAsMap() {
    return settingPort.findAll()
        .stream()
        .collect(Collectors.toMap(
            SystemSetting::getSettingKey,
            SystemSetting::getSettingValue));
  }

  /**
   * Get all feature flags as a map
   */
  @Transactional(readOnly = true)
  public Map<String, Boolean> getFeatureFlags() {
    return settingPort.findBySettingKeyStartingWith("feature.")
        .stream()
        .collect(Collectors.toMap(
            setting -> convertKeyToFrontendFormat(setting.getSettingKey()),
            setting -> "true".equalsIgnoreCase(setting.getSettingValue())));
  }

  /**
   * Get settings by category
   */
  @Transactional(readOnly = true)
  public List<SystemSetting> getSettingsByCategory(String category) {
    return settingPort.findByCategory(category);
  }

  /**
   * Get a specific setting by key
   */
  @Transactional(readOnly = true)
  public Optional<SystemSetting> getSetting(String key) {
    return settingPort.findBySettingKey(key);
  }

  /**
   * Get a setting value as string, with default fallback
   */
  @Transactional(readOnly = true)
  public String getSettingValue(String key, String defaultValue) {
    return settingPort.findBySettingKey(key)
        .map(SystemSetting::getSettingValue)
        .orElse(defaultValue);
  }

  /**
   * Get a setting value as boolean
   */
  @Transactional(readOnly = true)
  public boolean getBooleanSetting(String key, boolean defaultValue) {
    return settingPort.findBySettingKey(key)
        .map(setting -> "true".equalsIgnoreCase(setting.getSettingValue()))
        .orElse(defaultValue);
  }

  /**
   * Get a setting value as integer
   */
  @Transactional(readOnly = true)
  public int getIntSetting(String key, int defaultValue) {
    return settingPort.findBySettingKey(key)
        .map(setting -> {
          try {
            return Integer.parseInt(setting.getSettingValue());
          } catch (NumberFormatException e) {
            return defaultValue;
          }
        })
        .orElse(defaultValue);
  }

  /**
   * Update a setting value
   */
  @Transactional
  public SystemSetting updateSetting(String key, String value) {
    log.info("Updating setting: {} = {}", key, value);

    SystemSetting existing = settingPort.findBySettingKey(key)
        .orElseThrow(() -> new IllegalArgumentException("Setting not found: " + key));

    SystemSetting updated = existing.withValue(value);
    SystemSetting saved = settingPort.save(updated);

    log.debug("Setting updated successfully: {}", key);
    return saved;
  }

  /**
   * Update multiple settings at once
   */
  @Transactional
  public void updateSettings(Map<String, String> settings) {
    log.info("Updating {} settings", settings.size());

    settings.forEach((key, value) -> {
      String backendKey = convertFrontendKeyToBackendFormat(key);
      settingPort.findBySettingKey(backendKey).ifPresent(setting -> {
        SystemSetting updated = setting.withValue(value);
        settingPort.save(updated);
        log.debug("Updated setting: {} = {}", backendKey, value);
      });
    });
  }

  /**
   * Update feature flags from frontend format
   */
  @Transactional
  public void updateFeatureFlags(Map<String, Boolean> flags) {
    log.info("Updating {} feature flags", flags.size());

    flags.forEach((key, value) -> {
      String backendKey = convertFrontendKeyToBackendFormat(key);
      settingPort.findBySettingKey(backendKey).ifPresent(setting -> {
        SystemSetting updated = setting.withValue(value.toString());
        settingPort.save(updated);
        log.debug("Updated feature flag: {} = {}", backendKey, value);
      });
    });
  }

  /**
   * Create a new setting
   */
  @Transactional
  public SystemSetting createSetting(String key, String value, String category, String description) {
    log.info("Creating new setting: {} in category: {}", key, category);

    if (settingPort.existsBySettingKey(key)) {
      throw new IllegalArgumentException("Setting already exists: " + key);
    }

    SystemSetting setting = new SystemSetting(null, key, value, category, description, null, null);
    return settingPort.save(setting);
  }

  /**
   * Delete a setting
   */
  @Transactional
  public void deleteSetting(String key) {
    log.info("Deleting setting: {}", key);
    settingPort.deleteBySettingKey(key);
  }

  /**
   * Reset all settings to defaults
   */
  @Transactional
  public void resetToDefaults() {
    log.info("Resetting all settings to defaults");

    DEFAULT_SETTINGS.forEach((key, defaultSetting) -> {
      settingPort.findBySettingKey(key).ifPresent(setting -> {
        SystemSetting updated = setting.withValue(defaultSetting.value());
        settingPort.save(updated);
      });
    });

    log.info("All settings reset to defaults");
  }

  /**
   * Reset feature flags to defaults only
   */
  @Transactional
  public void resetFeatureFlagsToDefaults() {
    log.info("Resetting feature flags to defaults");

    DEFAULT_SETTINGS.entrySet().stream()
        .filter(entry -> entry.getKey().startsWith("feature."))
        .forEach(entry -> {
          settingPort.findBySettingKey(entry.getKey()).ifPresent(setting -> {
            SystemSetting updated = setting.withValue(entry.getValue().value());
            settingPort.save(updated);
          });
        });

    log.info("Feature flags reset to defaults");
  }

  /**
   * Check if a feature is enabled
   */
  @Transactional(readOnly = true)
  public boolean isFeatureEnabled(String featureKey) {
    String fullKey = featureKey.startsWith("feature.") ? featureKey : "feature." + featureKey;
    return getBooleanSetting(fullKey, false);
  }

  // Helper methods for key format conversion

  /**
   * Convert backend key format to frontend format
   * e.g., "feature.contribution.manual.enabled" -> "enableManualContribution"
   */
  private String convertKeyToFrontendFormat(String backendKey) {
    // Map of backend keys to frontend keys
    Map<String, String> keyMap = Map.ofEntries(
        // Feature flags
        Map.entry("feature.contribution.manual.enabled", "enableManualContribution"),
        Map.entry("feature.contribution.image.enabled", "enableImageContribution"),
        Map.entry("feature.contribution.paste.enabled", "enablePasteContribution"),
        Map.entry("feature.contribution.voice.enabled", "enableVoiceContribution"),
        Map.entry("feature.share.enabled", "enableShareRoute"),
        Map.entry("feature.addStops.enabled", "enableAddStops"),
        Map.entry("feature.reportIssue.enabled", "enableReportIssue"),
        Map.entry("feature.socialMedia.enabled", "enableSocialMedia"),
        Map.entry("feature.communityRewards.enabled", "enableCommunityRewards"),
        Map.entry("feature.businessPartners.enabled", "enableBusinessPartners"),
        Map.entry("feature.osmIntegration.enabled", "enableOsmIntegration"),
        Map.entry("feature.realTimeUpdates.enabled", "enableRealTimeUpdates"),
        // Security settings
        Map.entry("security.rateLimiting.enabled", "enableRateLimiting"),
        Map.entry("security.maxRequestsPerMinute", "maxRequestsPerMinute"),
        Map.entry("security.autoApproval.enabled", "enableAutoApproval"),
        Map.entry("security.requireEmailVerification", "requireEmailVerification"),
        // System settings
        Map.entry("system.geminiAi.enabled", "enableGeminiAI"),
        Map.entry("system.cacheEnabled", "enableCache"),
        Map.entry("system.maintenanceMode", "enableMaintenanceMode"));

    return keyMap.getOrDefault(backendKey, backendKey);
  }

  /**
   * Convert frontend key format to backend format
   * e.g., "enableManualContribution" -> "feature.contribution.manual.enabled"
   */
  private String convertFrontendKeyToBackendFormat(String frontendKey) {
    Map<String, String> keyMap = Map.ofEntries(
        // Feature flags
        Map.entry("enableManualContribution", "feature.contribution.manual.enabled"),
        Map.entry("enableImageContribution", "feature.contribution.image.enabled"),
        Map.entry("enablePasteContribution", "feature.contribution.paste.enabled"),
        Map.entry("enableVoiceContribution", "feature.contribution.voice.enabled"),
        Map.entry("enableShareRoute", "feature.share.enabled"),
        Map.entry("enableAddStops", "feature.addStops.enabled"),
        Map.entry("enableReportIssue", "feature.reportIssue.enabled"),
        Map.entry("enableSocialMedia", "feature.socialMedia.enabled"),
        Map.entry("enableCommunityRewards", "feature.communityRewards.enabled"),
        Map.entry("enableBusinessPartners", "feature.businessPartners.enabled"),
        Map.entry("enableOsmIntegration", "feature.osmIntegration.enabled"),
        Map.entry("enableRealTimeUpdates", "feature.realTimeUpdates.enabled"),
        // Security settings
        Map.entry("enableRateLimiting", "security.rateLimiting.enabled"),
        Map.entry("maxRequestsPerMinute", "security.maxRequestsPerMinute"),
        Map.entry("enableAutoApproval", "security.autoApproval.enabled"),
        Map.entry("requireEmailVerification", "security.requireEmailVerification"),
        // System settings
        Map.entry("enableGeminiAI", "system.geminiAi.enabled"),
        Map.entry("enableCache", "system.cacheEnabled"),
        Map.entry("enableMaintenanceMode", "system.maintenanceMode"));

    return keyMap.getOrDefault(frontendKey, frontendKey);
  }

  /**
   * Record class for default setting values
   */
  private record SettingDefault(String value, String category, String description) {
  }
}
