package com.perundhu.domain.port;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.perundhu.domain.model.Translatable;

/**
 * Port for translation services in the hexagonal architecture
 */
public interface TranslationService {

    /**
     * Get translation for an entity's field in a specific language
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param fieldName    The field name to translate
     * @param languageCode The language code to translate to
     * @return The translated value
     */
    <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode);

    /**
     * Get all translations for an entity in a specific language
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param languageCode The language code
     * @return Map of field names to translated values
     */
    <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode);

    /**
     * Get translations for a specific entity
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param languageCode The language code
     * @return Map of field names to translated values
     */
    <T> Map<String, String> getTranslations(Translatable<T> entity, String languageCode);

    /**
     * Get available languages for an entity
     * 
     * @param <T>    Entity type
     * @param entity The translatable entity
     * @return Set of available language codes
     */
    <T> Set<String> getAvailableLanguages(Translatable<T> entity);

    /**
     * Get all translations for all namespaces in a specific language
     * 
     * @param language The language code
     * @return Map of namespaces to translation maps
     */
    Map<String, Map<String, String>> getAllTranslations(String language);

    /**
     * Get translations for specific namespaces in a language
     * 
     * @param language   The language code
     * @param namespaces List of namespace names
     * @return Map of namespaces to translation maps
     */
    Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces);

    /**
     * Get translations for a specific namespace in a language
     * 
     * @param language  The language code
     * @param namespace The namespace name
     * @return Map of keys to translated values
     */
    Map<String, String> getTranslationsForNamespace(String language, String namespace);

    /**
     * Save a translation for an entity field in a specific language
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param fieldName    The field name to translate
     * @param languageCode The language code of the translation
     * @param value        The translated value
     */
    <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

    /**
     * Save multiple translations for an entity
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param translations Map of language codes to maps of field names and values
     */
    <T> void saveTranslations(Translatable<T> entity, Map<String, Map<String, String>> translations);

    /**
     * Add a translation (alias for saveTranslation)
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param fieldName    The field name to translate
     * @param languageCode The language code of the translation
     * @param value        The translated value
     */
    <T> void addTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

    /**
     * Delete a translation for an entity field in a specific language
     * 
     * @param <T>          Entity type
     * @param entity       The translatable entity
     * @param fieldName    The field name to delete translation for
     * @param languageCode The language code to delete translation for
     * @return True if deleted, false otherwise
     */
    <T> boolean deleteTranslation(Translatable<T> entity, String fieldName, String languageCode);

    /**
     * Check if the translation service is available
     * 
     * @return True if available, false otherwise
     */
    boolean isAvailable();

    /**
     * Detect the language of a text
     * 
     * @param text The text to detect language from
     * @return The detected language code
     */
    String detectLanguage(String text);

    /**
     * Translate a text from one language to another
     * 
     * @param text           The text to translate
     * @param sourceLanguage The source language code
     * @param targetLanguage The target language code
     * @return The translated text
     */
    String translate(String text, String sourceLanguage, String targetLanguage);

    /**
     * Get translations for an entity type and ID
     * 
     * @param entityType The entity type
     * @param entityId   The entity ID
     * @return Map of translations
     */
    Map<String, Object> getEntityTranslations(String entityType, Long entityId);

    /**
     * Get a translatable proxy for an entity type and ID
     * 
     * @param entityType The entity type
     * @param entityId   The entity ID
     * @return Optional containing the translatable proxy, or empty if not found
     */
    Optional<Translatable> getTranslatable(String entityType, Long entityId);

    /**
     * Determines if the translation iteration process should continue.
     * This is used in the translation workflow to decide whether to proceed with
     * another round.
     *
     * @return boolean indicating whether to continue iterating
     */
    boolean shouldContinueIteration();

    /**
     * Determines if the translation iteration process should continue with
     * additional parameters
     *
     * @param iteration      The current iteration count
     * @param completionRate The current completion rate (0.0-1.0) or null if not
     *                       available
     * @param qualityMetric  Quality metric information (could be a score or
     *                       category)
     * @return boolean indicating whether to continue iterating
     */
    default boolean shouldContinueIteration(int iteration, Double completionRate, String qualityMetric) {
        // Default implementation delegates to the no-arg version
        return shouldContinueIteration();
    }
}
