package com.perundhu.domain.model;

/**
 * Proxy class for translatable entities using Java 17 record
 */
public record TranslatableProxy(
    String entityType,
    Long entityId,
    String fieldName,
    String originalValue,
    String currentLanguage) {
  public TranslatableProxy {
    if (entityType == null || entityType.isEmpty()) {
      throw new IllegalArgumentException("Entity type cannot be null or empty");
    }
    if (entityId == null || entityId <= 0) {
      throw new IllegalArgumentException("Entity ID must be a positive number");
    }
    if (fieldName == null || fieldName.isEmpty()) {
      throw new IllegalArgumentException("Field name cannot be null or empty");
    }
  }

  public static TranslatableProxy of(String entityType, Long entityId, String fieldName, String originalValue) {
    return new TranslatableProxy(entityType, entityId, fieldName, originalValue, "en");
  }

  public static TranslatableProxy of(String entityType, Long entityId, String fieldName, String originalValue,
      String language) {
    return new TranslatableProxy(entityType, entityId, fieldName, originalValue, language);
  }
}