package com.perundhu.domain.port;

import com.perundhu.domain.model.TranslatableProxy;
import com.perundhu.domain.model.Translation;
import java.util.List;

/**
 * Domain port interface for translation operations
 */
public interface TranslationServicePort {

  /**
   * Get a translatable entity proxy
   *
   * @param entityType The type of entity (e.g., "Location", "Bus", "Stop")
   * @param entityId   The ID of the entity
   * @param fieldName  The field name to translate
   * @return TranslatableProxy containing the entity information
   */
  TranslatableProxy getTranslatable(String entityType, Long entityId, String fieldName);

  /**
   * Get all translations for a specific entity field
   *
   * @param entityType The type of entity
   * @param entityId   The ID of the entity
   * @param fieldName  The field name
   * @return List of translations for the specified entity field
   */
  List<Translation> getTranslations(String entityType, Long entityId, String fieldName);

  /**
   * Add a new translation
   *
   * @param translation The translation to add
   * @return The saved translation
   */
  Translation addTranslation(Translation translation);

  /**
   * Delete a translation by ID
   *
   * @param translationId The ID of the translation to delete
   * @return true if deleted successfully, false if not found
   */
  boolean deleteTranslation(Long translationId);

  /**
   * Get translation for a specific entity field in a specific language
   *
   * @param entityType   The type of entity
   * @param entityId     The ID of the entity
   * @param fieldName    The field name
   * @param languageCode The language code (e.g., "en", "ta")
   * @return The translation if found, null otherwise
   */
  Translation getTranslation(String entityType, Long entityId, String fieldName, String languageCode);
}