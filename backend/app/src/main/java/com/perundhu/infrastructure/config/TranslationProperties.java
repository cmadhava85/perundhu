package com.perundhu.infrastructure.config;

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
}