package com.perundhu.domain.port;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import com.perundhu.domain.model.Translatable;

/**
 * Port for caching translation services in the hexagonal architecture
 * Extends basic translation functionality with caching capabilities
 */
public interface CachingTranslationService {

  /**
   * Get translation for a specific entity field with caching
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param fieldName    The field name
   * @param languageCode The language code
   * @return The translated value or default value
   */
  <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode);

  /**
   * Get all translations for an entity in a specific language with caching
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param languageCode The language code
   * @return Map of field names to translated values
   */
  <T> Map<String, String> getTranslations(Translatable<T> entity, String languageCode);

  /**
   * Get all translations for an entity in a specific language with caching
   * (alias)
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param languageCode The language code
   * @return Map of field names to translated values
   */
  <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode);

  /**
   * Get all translations for a specific language
   * 
   * @param languageCode The language code
   * @return Map of entity types to translation maps
   */
  Map<String, Map<String, String>> getAllTranslations(String languageCode);

  /**
   * Get available languages for an entity with caching
   * 
   * @param <T>    Entity type
   * @param entity The translatable entity
   * @return Set of available language codes
   */
  <T> Set<String> getAvailableLanguages(Translatable<T> entity);

  /**
   * Get translations for specific namespaces with caching
   * 
   * @param language   The language code
   * @param namespaces List of namespace names
   * @return Map of namespaces to translation maps
   */
  Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces);

  /**
   * Get translations for a specific namespace with caching
   * 
   * @param language  The language code
   * @param namespace The namespace name
   * @return Map of keys to translated values
   */
  Map<String, String> getTranslationsForNamespace(String language, String namespace);

  /**
   * Save a translation and invalidate relevant caches
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param fieldName    The field name
   * @param languageCode The language code
   * @param value        The translated value
   */
  <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

  /**
   * Save multiple translations and invalidate relevant caches
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param translations Map of language codes to field translations
   */
  <T> void saveTranslations(Translatable<T> entity, Map<String, Map<String, String>> translations);

  /**
   * Add a translation (alias for saveTranslation)
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param fieldName    The field name
   * @param languageCode The language code
   * @param value        The translated value
   */
  <T> void addTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

  /**
   * Delete a translation and invalidate relevant caches
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param fieldName    The field name
   * @param languageCode The language code
   * @return true if the translation was deleted, false otherwise
   */
  <T> boolean deleteTranslation(Translatable<T> entity, String fieldName, String languageCode);

  /**
   * Get entity translations as a map
   * 
   * @param entityType The entity type
   * @param entityId   The entity ID
   * @return Map containing entity information and translations
   */
  Map<String, Object> getEntityTranslations(String entityType, Long entityId);

  /**
   * Get a translatable proxy for an entity
   * 
   * @param entityType The entity type
   * @param entityId   The entity ID
   * @return Optional containing the translatable proxy
   */
  Optional<Translatable> getTranslatable(String entityType, Long entityId);

  /**
   * Detect the language of a text
   * 
   * @param text The text to analyze
   * @return The detected language code
   */
  String detectLanguage(String text);

  /**
   * Translate text from one language to another
   * 
   * @param text           The text to translate
   * @param sourceLanguage The source language code
   * @param targetLanguage The target language code
   * @return The translated text
   */
  String translate(String text, String sourceLanguage, String targetLanguage);

  /**
   * Check if the translation service is available
   * 
   * @return true if the service is available, false otherwise
   */
  boolean isAvailable();

  /**
   * Check if iteration should continue
   * 
   * @return true if iteration should continue, false otherwise
   */
  boolean shouldContinueIteration();

  /**
   * Check if iteration should continue with metrics
   * 
   * @param iteration      The current iteration number
   * @param completionRate The completion rate
   * @param qualityMetric  The quality metric
   * @return true if iteration should continue, false otherwise
   */
  boolean shouldContinueIteration(int iteration, Double completionRate, String qualityMetric);

  /**
   * Clear all translation caches
   */
  void clearCache();

  /**
   * Clear cache for a specific entity
   * 
   * @param <T>    Entity type
   * @param entity The translatable entity
   */
  <T> void clearCacheForEntity(Translatable<T> entity);

  /**
   * Clear cache for a specific language
   * 
   * @param languageCode The language code
   */
  void clearCacheForLanguage(String languageCode);
}