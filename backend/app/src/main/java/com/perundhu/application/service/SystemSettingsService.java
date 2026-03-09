package com.perundhu.application.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.SystemSetting;
import com.perundhu.domain.port.SystemSettingPort;
import com.perundhu.infrastructure.config.CacheConfig;

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
        new SettingDefault("false", "features", "Enable image-based route contribution"));
    DEFAULT_SETTINGS.put("feature.contribution.paste.enabled",
        new SettingDefault("false", "features", "Enable paste text contribution"));
    DEFAULT_SETTINGS.put("feature.contribution.voice.enabled",
        new SettingDefault("false", "features", "Enable voice input contribution"));
    DEFAULT_SETTINGS.put("feature.contribution.verification.enabled",
        new SettingDefault("false", "features", "Enable route verification contribution"));

    // UI action toggles
    DEFAULT_SETTINGS.put("feature.share.enabled",
        new SettingDefault("false", "features", "Enable share route functionality"));
    DEFAULT_SETTINGS.put("feature.addStops.enabled",
        new SettingDefault("false", "features", "Enable add stops functionality"));
    DEFAULT_SETTINGS.put("feature.reportIssue.enabled",
        new SettingDefault("false", "features", "Enable report issue functionality"));

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
    DEFAULT_SETTINGS.put("feature.map.enabled",
        new SettingDefault("false", "features", "Enable map feature"));

    // Bus Reviews settings
    DEFAULT_SETTINGS.put("feature.busReviews.enabled",
        new SettingDefault("true", "features", "Enable bus reviews"));
    DEFAULT_SETTINGS.put("feature.busReviews.requireLogin",
        new SettingDefault("false", "features", "Require login to submit bus reviews"));
    DEFAULT_SETTINGS.put("feature.busReviews.autoApprove",
        new SettingDefault("true", "features", "Auto-approve bus reviews"));

    // Google AdSense settings
    DEFAULT_SETTINGS.put("feature.ads.enabled",
        new SettingDefault("true", "features", "Enable Google AdSense ads"));
    DEFAULT_SETTINGS.put("feature.ads.betweenSearchResults.enabled",
        new SettingDefault("true", "features", "Enable ad between search results"));
    DEFAULT_SETTINGS.put("feature.ads.sidebarRight.enabled",
        new SettingDefault("true", "features", "Enable sidebar right ad"));
    DEFAULT_SETTINGS.put("feature.ads.footerSection.enabled",
        new SettingDefault("true", "features", "Enable footer section ad"));
    DEFAULT_SETTINGS.put("feature.ads.aboveSearchForm.enabled",
        new SettingDefault("false", "features", "Enable ad above search form"));

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
   * Initialize default settings on application startup.
   * Note: We do NOT use @Transactional here because @PostConstruct runs before
   * the Spring transaction proxy is created. Instead, we rely on each settingPort
   * method to handle its own transaction context if needed.
   */
  @PostConstruct
  public void initializeDefaultSettings() {
    try {
      log.info("Initializing default system settings");

      DEFAULT_SETTINGS.forEach((key, defaultSetting) -> {
        try {
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
        } catch (Exception e) {
          log.warn("Failed to initialize setting: {}", key, e);
        }
      });

      log.info("System settings initialization complete");
    } catch (Exception e) {
      log.error("Error during system settings initialization", e);
      // Don't throw - allow application to continue even if settings initialization
      // fails
    }
  }

  /**
   * Get all settings
   */
  @Cacheable(value = CacheConfig.SETTINGS_CACHE, key = "'all'")
  @Transactional(readOnly = true)
  public List<SystemSetting> getAllSettings() {
    return settingPort.findAllOrderedByCategoryAndKey();
  }

  /**
   * Get all settings as a map (key -> value)
   */
  @Cacheable(value = CacheConfig.SETTINGS_CACHE, key = "'map'")
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
  @Cacheable(value = CacheConfig.SETTINGS_CACHE, key = "'feature-flags'")
  @Transactional(readOnly = true)
  public Map<String, Boolean> getFeatureFlags() {
    return settingPort.findBySettingKeyStartingWith("feature.")
        .stream()
        .filter(setting -> convertKeyToFrontendFormat(setting.getSettingKey()) != null)
        .collect(Collectors.toMap(
            setting -> convertKeyToFrontendFormat(setting.getSettingKey()),
            setting -> "true".equalsIgnoreCase(setting.getSettingValue())));
  }

  /**
   * Get settings by category
   */
  @Cacheable(value = CacheConfig.SETTINGS_CACHE, key = "'category-' + #category")
  @Transactional(readOnly = true)
  public List<SystemSetting> getSettingsByCategory(String category) {
    return settingPort.findByCategory(category);
  }

  /**
   * Get a specific setting by key
   */
  @Cacheable(value = CacheConfig.SETTINGS_CACHE, key = "'key-' + #key")
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
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public SystemSetting updateSetting(String key, String value) {
    log.info("Updating setting: {} = {} (cache will be evicted)", key, value);

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
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public void updateSettings(Map<String, String> settings) {
    log.info("Updating {} settings (cache will be evicted)", settings.size());

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
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public void updateFeatureFlags(Map<String, Boolean> flags) {
    log.info("Updating {} feature flags (cache will be evicted)", flags.size());

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
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public SystemSetting createSetting(String key, String value, String category, String description) {
    log.info("Creating new setting: {} in category: {} (cache will be evicted)", key, category);

    if (settingPort.existsBySettingKey(key)) {
      throw new IllegalArgumentException("Setting already exists: " + key);
    }

    SystemSetting setting = new SystemSetting(null, key, value, category, description, null, null);
    return settingPort.save(setting);
  }

  /**
   * Delete a setting
   */
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public void deleteSetting(String key) {
    log.info("Deleting setting: {} (cache will be evicted)", key);
    settingPort.deleteBySettingKey(key);
  }

  /**
   * Reset all settings to defaults
   */
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public void resetToDefaults() {
    log.info("Resetting all settings to defaults (cache will be evicted)");

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
  @CacheEvict(value = CacheConfig.SETTINGS_CACHE, allEntries = true)
  @Transactional
  public void resetFeatureFlagsToDefaults() {
    log.info("Resetting feature flags to defaults (cache will be evicted)");

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
   * Accepts both frontend format (e.g., "enableShareRoute") and backend format
   * (e.g., "feature.share.enabled")
   */
  @Cacheable(value = CacheConfig.SETTINGS_CACHE, key = "'feature-' + #featureKey")
  @Transactional(readOnly = true)
  public boolean isFeatureEnabled(String featureKey) {
    // If it's already a backend format key (starts with "feature."), use it
    // directly
    // Otherwise, convert from frontend format (e.g., "enableShareRoute" ->
    // "feature.share.enabled")
    String backendKey = featureKey.startsWith("feature.")
        ? featureKey
        : convertFrontendKeyToBackendFormat(featureKey);

    return getBooleanSetting(backendKey, false);
  }

  // Helper methods for key format conversion

  /**
   * Convert backend key format to frontend format
   * e.g., "feature.contribution.manual.enabled" -> "enableManualContribution"
   */
  private String convertKeyToFrontendFormat(String backendKey) {
    // Map of backend keys to frontend keys. Returns null for unmapped keys so
    // callers can filter them out rather than leaking raw dot-notation keys.
    Map<String, String> keyMap = Map.ofEntries(
        // Feature flags
        Map.entry("feature.contribution.manual.enabled", "enableManualContribution"),
        Map.entry("feature.contribution.image.enabled", "enableImageContribution"),
        Map.entry("feature.contribution.paste.enabled", "enablePasteContribution"),
        Map.entry("feature.contribution.voice.enabled", "enableVoiceContribution"),
        Map.entry("feature.contribution.verification.enabled", "enableRouteVerification"),
        Map.entry("feature.share.enabled", "enableShareRoute"),
        Map.entry("feature.addStops.enabled", "enableAddStops"),
        Map.entry("feature.reportIssue.enabled", "enableReportIssue"),
        Map.entry("feature.socialMedia.enabled", "enableSocialMedia"),
        Map.entry("feature.communityRewards.enabled", "enableCommunityRewards"),
        Map.entry("feature.businessPartners.enabled", "enableBusinessPartners"),
        Map.entry("feature.osmIntegration.enabled", "enableOsmIntegration"),
        Map.entry("feature.realTimeUpdates.enabled", "enableRealTimeUpdates"),
        Map.entry("feature.map.enabled", "enableMap"),
        Map.entry("feature.busReviews.enabled", "enableBusReviews"),
        Map.entry("feature.busReviews.requireLogin", "busReviewsRequireLogin"),
        Map.entry("feature.busReviews.autoApprove", "busReviewsAutoApprove"),
        Map.entry("feature.ads.enabled", "enableAds"),
        Map.entry("feature.ads.betweenSearchResults.enabled", "enableAdBetweenSearchResults"),
        Map.entry("feature.ads.sidebarRight.enabled", "enableAdSidebarRight"),
        Map.entry("feature.ads.footerSection.enabled", "enableAdFooterSection"),
        Map.entry("feature.ads.aboveSearchForm.enabled", "enableAdAboveSearchForm"),
        // Security settings
        Map.entry("security.rateLimiting.enabled", "enableRateLimiting"),
        Map.entry("security.maxRequestsPerMinute", "maxRequestsPerMinute"),
        Map.entry("security.autoApproval.enabled", "enableAutoApproval"),
        Map.entry("security.requireEmailVerification", "requireEmailVerification"),
        // System settings
        Map.entry("system.geminiAi.enabled", "enableGeminiAI"),
        Map.entry("system.cacheEnabled", "enableCache"),
        Map.entry("system.maintenanceMode", "enableMaintenanceMode"));

    return keyMap.getOrDefault(backendKey, null);
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
        Map.entry("enableRouteVerification", "feature.contribution.verification.enabled"),
        Map.entry("enableShareRoute", "feature.share.enabled"),
        Map.entry("enableAddStops", "feature.addStops.enabled"),
        Map.entry("enableReportIssue", "feature.reportIssue.enabled"),
        Map.entry("enableSocialMedia", "feature.socialMedia.enabled"),
        Map.entry("enableCommunityRewards", "feature.communityRewards.enabled"),
        Map.entry("enableBusinessPartners", "feature.businessPartners.enabled"),
        Map.entry("enableOsmIntegration", "feature.osmIntegration.enabled"),
        Map.entry("enableRealTimeUpdates", "feature.realTimeUpdates.enabled"),
        Map.entry("enableMap", "feature.map.enabled"),
        Map.entry("enableBusReviews", "feature.busReviews.enabled"),
        Map.entry("busReviewsRequireLogin", "feature.busReviews.requireLogin"),
        Map.entry("busReviewsAutoApprove", "feature.busReviews.autoApprove"),
        Map.entry("enableAds", "feature.ads.enabled"),
        Map.entry("enableAdBetweenSearchResults", "feature.ads.betweenSearchResults.enabled"),
        Map.entry("enableAdSidebarRight", "feature.ads.sidebarRight.enabled"),
        Map.entry("enableAdFooterSection", "feature.ads.footerSection.enabled"),
        Map.entry("enableAdAboveSearchForm", "feature.ads.aboveSearchForm.enabled"),
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
