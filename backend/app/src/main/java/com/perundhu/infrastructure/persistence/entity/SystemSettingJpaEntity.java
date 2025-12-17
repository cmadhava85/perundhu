package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.SystemSetting;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA entity for system settings.
 * Stores configuration key-value pairs that can be modified by admins.
 */
@Entity
@Table(name = "system_settings", uniqueConstraints = {
    @UniqueConstraint(columnNames = { "setting_key" })
})
public class SystemSettingJpaEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @NotBlank(message = "Setting key must not be blank")
  @Size(max = 100, message = "Setting key must not exceed 100 characters")
  @Column(name = "setting_key", nullable = false, unique = true, length = 100)
  private String settingKey;

  @Column(name = "setting_value", columnDefinition = "TEXT")
  private String settingValue;

  @Size(max = 50, message = "Category must not exceed 50 characters")
  @Column(name = "category", length = 50)
  private String category;

  @Size(max = 255, message = "Description must not exceed 255 characters")
  @Column(name = "description")
  private String description;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at", nullable = false)
  private LocalDateTime updatedAt;

  // Default constructor (required by JPA)
  public SystemSettingJpaEntity() {
  }

  // Constructor with key and value
  public SystemSettingJpaEntity(String settingKey, String settingValue) {
    this.settingKey = settingKey;
    this.settingValue = settingValue;
    this.category = "general";
  }

  // Constructor with key, value, and category
  public SystemSettingJpaEntity(String settingKey, String settingValue, String category) {
    this.settingKey = settingKey;
    this.settingValue = settingValue;
    this.category = category;
  }

  // Full constructor
  public SystemSettingJpaEntity(Long id, String settingKey, String settingValue,
      String category, String description) {
    this.id = id;
    this.settingKey = settingKey;
    this.settingValue = settingValue;
    this.category = category;
    this.description = description;
  }

  @PrePersist
  protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
  }

  // Getters and Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getSettingKey() {
    return settingKey;
  }

  public void setSettingKey(String settingKey) {
    this.settingKey = settingKey;
  }

  public String getSettingValue() {
    return settingValue;
  }

  public void setSettingValue(String settingValue) {
    this.settingValue = settingValue;
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

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
  }

  public LocalDateTime getUpdatedAt() {
    return updatedAt;
  }

  public void setUpdatedAt(LocalDateTime updatedAt) {
    this.updatedAt = updatedAt;
  }

  // Convert to domain model
  public SystemSetting toDomain() {
    return new SystemSetting(
        id,
        settingKey,
        settingValue,
        category,
        description,
        createdAt,
        updatedAt);
  }

  // Create from domain model
  public static SystemSettingJpaEntity fromDomain(SystemSetting setting) {
    SystemSettingJpaEntity entity = new SystemSettingJpaEntity();
    entity.setId(setting.getId());
    entity.setSettingKey(setting.getSettingKey());
    entity.setSettingValue(setting.getSettingValue());
    entity.setCategory(setting.getCategory());
    entity.setDescription(setting.getDescription());
    if (setting.getCreatedAt() != null) {
      entity.setCreatedAt(setting.getCreatedAt());
    }
    if (setting.getUpdatedAt() != null) {
      entity.setUpdatedAt(setting.getUpdatedAt());
    }
    return entity;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (o == null || getClass() != o.getClass())
      return false;
    SystemSettingJpaEntity that = (SystemSettingJpaEntity) o;
    return Objects.equals(id, that.id) && Objects.equals(settingKey, that.settingKey);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, settingKey);
  }

  @Override
  public String toString() {
    return "SystemSettingJpaEntity{" +
        "id=" + id +
        ", settingKey='" + settingKey + '\'' +
        ", settingValue='" + settingValue + '\'' +
        ", category='" + category + '\'' +
        '}';
  }
}
