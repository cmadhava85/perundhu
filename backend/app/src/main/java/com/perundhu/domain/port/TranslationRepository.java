package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Translation;

/**
 * Domain port for Translation repository operations
 */
public interface TranslationRepository {

    /**
     * Find a specific translation by entity, language, and field
     */
    Optional<Translation> findTranslation(String entityType, Long entityId, String languageCode, String fieldName);

    /**
     * Find all translations for a specific entity and language
     */
    List<Translation> findByEntityAndLanguage(String entityType, Long entityId, String languageCode);

    /**
     * Find all translations for a specific entity
     */
    List<Translation> findByEntity(String entityType, Long entityId);

    /**
     * Save a translation
     */
    Translation save(Translation translation);

    /**
     * Delete a translation
     */
    void delete(Translation translation);

    /**
     * Delete a translation by ID
     */
    void delete(Long id);

    /**
     * Delete all translations for a specific entity
     */
    void deleteByEntity(String entityType, Long entityId);

    /**
     * Check if translation exists
     */
    boolean exists(String entityType, Long entityId, String languageCode, String fieldName);

    /**
     * Find by entity type and entity ID and field name and language code
     */
    Optional<Translation> findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
            String entityType, Long entityId, String fieldName, String languageCode);

    /**
     * Find all translations for a specific language
     */
    List<Translation> findByLanguage(String languageCode);

    /**
     * Find all translations for a specific entity type and language
     */
    List<Translation> findByEntityTypeAndLanguage(String entityType, String languageCode);

    /**
     * Find translations by entity type, language, and translated value pattern (for
     * efficient autocomplete)
     * This method performs indexed database query instead of loading all
     * translations
     * 
     * @param entityType             The entity type (e.g., "LOCATION")
     * @param languageCode           The language code (e.g., "ta")
     * @param translatedValuePattern The pattern to search for in translated values
     * @return List of matching translations
     */
    List<Translation> findByEntityTypeAndLanguageAndTranslatedValueContaining(
            String entityType, String languageCode, String translatedValuePattern);
}
