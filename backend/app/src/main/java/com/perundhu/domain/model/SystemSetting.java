package com.perundhu.domain.model;

import java.time.LocalDateTime;

/**
 * Domain model for system settings.
 * Represents a key-value configuration setting that can be modified by admins.
 * Immutable implementation following domain-driven design principles.
 */
public class SystemSetting {

  private final Long id;
  private final String settingKey;
  private final String settingValue;
  private final String category;
  private final String description;
  private final LocalDateTime createdAt;
  private final LocalDateTime updatedAt;

  /**
   * Default constructor
   */
  public SystemSetting() {
    this(null, null, null, null, null, LocalDateTime.now(), LocalDateTime.now());
  }

  /**
   * Constructor with key and value
   * 
   * @param settingKey   Setting key
   * @param settingValue Setting value
   */
  public SystemSetting(String settingKey, String settingValue) {
    this(null, settingKey, settingValue, "general", null, LocalDateTime.now(), LocalDateTime.now());
  }

  /**
   * Constructor with key, value, and category
   * 
   * @param settingKey   Setting key
   * @param settingValue Setting value
   * @param category     Setting category
   */
  public SystemSetting(String settingKey, String settingValue, String category) {
    this(null, settingKey, settingValue, category, null, LocalDateTime.now(), LocalDateTime.now());
  }

  /**
   * Full constructor
   * 
   * @param id           Setting ID
   * @param settingKey   Setting key
   * @param settingValue Setting value
   * @param category     Setting category
   * @param description  Setting description
   * @param createdAt    Creation timestamp
   * @param updatedAt    Last update timestamp
   */
  public SystemSetting(Long id, String settingKey, String settingValue, String category,
      String description, LocalDateTime createdAt, LocalDateTime updatedAt) {
    this.id = id;
    this.settingKey = settingKey;
    this.settingValue = settingValue;
    this.category = category;
    this.description = description;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  // Getters
  public Long getId() {
    return id;
  }

  public String getSettingKey() {
    return settingKey;
  }

  public String getSettingValue() {
    return settingValue;
  }

  public String getCategory() {
    return category;
  }

  public String getDescription() {
    return description;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  /**
   * Get the setting value as a boolean
   * 
   * @return Boolean value, defaults to false if not parseable
   */
  public boolean getBooleanValue() {
    return "true".equalsIgnoreCase(settingValue);
  }

  /**
   * Get the setting value as an integer
   * 
   * @param defaultValue Default value if not parseable
   * @return Integer value
   */
  public int getIntValue(int defaultValue) {
    try {
      return Integer.parseInt(settingValue);
    } catch (NumberFormatException e) {
      return defaultValue;
    }
  }

  /**
   * Create a copy with updated value
   * 
   * @param newValue New value
   * @return New SystemSetting instance
   */
  public SystemSetting withValue(String newValue) {
    return new SystemSetting(id, settingKey, newValue, category, description, createdAt, LocalDateTime.now());
  }

  @Override
  public String toString() {
    return "SystemSetting{" +
        "id=" + id +
        ", settingKey='" + settingKey + '\'' +
        ", settingValue='" + settingValue + '\'' +
        ", category='" + category + '\'' +
        '}';
  }
}
