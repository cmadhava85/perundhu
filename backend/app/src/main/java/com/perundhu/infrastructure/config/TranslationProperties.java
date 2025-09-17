package com.perundhu.infrastructure.config;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration properties for translation services
 */
@Component
@ConfigurationProperties(prefix = "translation")
public class TranslationProperties {

  private String defaultLanguage = "en";
  private String fallbackLanguage = "en";
  private boolean enableCaching = true;
  private int cacheExpirationMinutes = 60;
  private boolean enableAutoTranslation = false;
  private List<String> supportedLanguages = List.of("en", "ta", "hi", "ml", "te", "kn");
  private double completionThreshold = 0.8;
  private double errorThreshold = 0.1;
  private double qualityThreshold = 0.8;

  public String getDefaultLanguage() {
    return defaultLanguage;
  }

  public void setDefaultLanguage(String defaultLanguage) {
    this.defaultLanguage = defaultLanguage;
  }

  public String getFallbackLanguage() {
    return fallbackLanguage;
  }

  public void setFallbackLanguage(String fallbackLanguage) {
    this.fallbackLanguage = fallbackLanguage;
  }

  public boolean isEnableCaching() {
    return enableCaching;
  }

  public void setEnableCaching(boolean enableCaching) {
    this.enableCaching = enableCaching;
  }

  public int getCacheExpirationMinutes() {
    return cacheExpirationMinutes;
  }

  public void setCacheExpirationMinutes(int cacheExpirationMinutes) {
    this.cacheExpirationMinutes = cacheExpirationMinutes;
  }

  public boolean isEnableAutoTranslation() {
    return enableAutoTranslation;
  }

  public void setEnableAutoTranslation(boolean enableAutoTranslation) {
    this.enableAutoTranslation = enableAutoTranslation;
  }

  public List<String> getSupportedLanguages() {
    return supportedLanguages;
  }

  public void setSupportedLanguages(List<String> supportedLanguages) {
    this.supportedLanguages = supportedLanguages;
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