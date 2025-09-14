package com.perundhu.infrastructure.config;

import java.util.List;
import java.util.Map;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for translation service
 */
@Component
@ConfigurationProperties(prefix = "translation")
public class TranslationProperties {

  /**
   * Default language code
   */
  private String defaultLanguage = "en";

  /**
   * Supported languages
   */
  private List<String> supportedLanguages = List.of("en", "ta", "hi", "ml", "te", "kn");

  /**
   * Cache TTL in seconds
   */
  private long cacheTtlSeconds = 3600;

  /**
   * Enable translation caching
   */
  private boolean cachingEnabled = true;

  /**
   * Translation service provider settings
   */
  private Map<String, String> provider = Map.of(
      "type", "internal",
      "fallback", "true");

  /**
   * External translation service settings
   */
  private ExternalService external = new ExternalService();

  /**
   * Completion threshold for iteration decisions (0.0-1.0)
   */
  private double completionThreshold = 0.95;

  /**
   * Error threshold for iteration decisions (0.0-1.0)
   */
  private double errorThreshold = 0.1;

  /**
   * Quality threshold for iteration decisions (0.0-1.0)
   */
  private double qualityThreshold = 0.8;

  public static class ExternalService {
    private String apiKey;
    private String baseUrl;
    private boolean enabled = false;
    private int timeoutMs = 5000;

    // Getters and setters
    public String getApiKey() {
      return apiKey;
    }

    public void setApiKey(String apiKey) {
      this.apiKey = apiKey;
    }

    public String getBaseUrl() {
      return baseUrl;
    }

    public void setBaseUrl(String baseUrl) {
      this.baseUrl = baseUrl;
    }

    public boolean isEnabled() {
      return enabled;
    }

    public void setEnabled(boolean enabled) {
      this.enabled = enabled;
    }

    public int getTimeoutMs() {
      return timeoutMs;
    }

    public void setTimeoutMs(int timeoutMs) {
      this.timeoutMs = timeoutMs;
    }
  }

  // Getters and setters
  public String getDefaultLanguage() {
    return defaultLanguage;
  }

  public void setDefaultLanguage(String defaultLanguage) {
    this.defaultLanguage = defaultLanguage;
  }

  public List<String> getSupportedLanguages() {
    return supportedLanguages;
  }

  public void setSupportedLanguages(List<String> supportedLanguages) {
    this.supportedLanguages = supportedLanguages;
  }

  public long getCacheTtlSeconds() {
    return cacheTtlSeconds;
  }

  public void setCacheTtlSeconds(long cacheTtlSeconds) {
    this.cacheTtlSeconds = cacheTtlSeconds;
  }

  public boolean isCachingEnabled() {
    return cachingEnabled;
  }

  public void setCachingEnabled(boolean cachingEnabled) {
    this.cachingEnabled = cachingEnabled;
  }

  public Map<String, String> getProvider() {
    return provider;
  }

  public void setProvider(Map<String, String> provider) {
    this.provider = provider;
  }

  public ExternalService getExternal() {
    return external;
  }

  public void setExternal(ExternalService external) {
    this.external = external;
  }

  public double getCompletionThreshold() {
    return completionThreshold;
  }

  public void setCompletionThreshold(double completionThreshold) {
    this.completionThreshold = completionThreshold;
  }

  public double getErrorThreshold() {
    return errorThreshold;
  }

  public void setErrorThreshold(double errorThreshold) {
    this.errorThreshold = errorThreshold;
  }

  public double getQualityThreshold() {
    return qualityThreshold;
  }

  public void setQualityThreshold(double qualityThreshold) {
    this.qualityThreshold = qualityThreshold;
  }
}