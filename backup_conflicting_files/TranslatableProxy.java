package com.perundhu.domain.model;

import java.util.Map;
import java.util.Set;

/**
 * Interface for translation proxy objects in the domain model.
 * Used to access translated entity data with added functionality.
 * Part of the domain model following hexagonal architecture principles.
 */
public interface TranslatableProxy {

  /**
   * Get the entity ID as a string
   * 
   * @return The entity ID as a string
   */
  String getEntityIdAsString();

  /**
   * Get the translated entity as a map
   * 
   * @return The translated entity
   */
  Map<String, Object> getTranslatedEntity();

  /**
   * Get the available languages for this entity
   * 
   * @return The set of available language codes
   */
  Set<String> getAvailableLanguages();

  /**
   * Add a translation for a specific field and language
   * 
   * @param fieldName    The field name
   * @param languageCode The language code
   * @param value        The translated value
   */
  void addTranslation(String fieldName, String languageCode, String value);

  /**
   * Remove a translation for a specific field and language
   * 
   * @param fieldName    The field name
   * @param languageCode The language code
   */
  void removeTranslation(String fieldName, String languageCode);
}