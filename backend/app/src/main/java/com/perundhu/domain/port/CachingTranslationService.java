package com.perundhu.domain.port;

import com.perundhu.domain.model.Translatable;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Port interface for caching translation services
 * Extends the basic translation service with caching capabilities
 */
public interface CachingTranslationService {

  /**
   * Get translation for an entity's field in a specific language with caching
   */
  <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode);

  /**
   * Get all translations for an entity in a specific language with caching
   */
  <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode);

  /**
   * Get all translations for all entities in a specific language
   */
  Map<String, Map<String, String>> getAllTranslations(String languageCode);

  /**
   * Get translations for a specific namespace in a language
   */
  Map<String, String> getTranslationsForNamespace(String language, String namespace);

  /**
   * Get translations for specific namespaces in a language
   */
  Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces);

  /**
   * Save a translation with cache invalidation
   */
  <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

  /**
   * Save multiple translations with cache invalidation
   */
  <T> void saveTranslations(Translatable<T> entity, Map<String, Map<String, String>> translations);

  /**
   * Delete a translation with cache invalidation
   */
  <T> boolean deleteTranslation(Translatable<T> entity, String fieldName, String languageCode);

  /**
   * Get translations for an entity in a specific language (alias for getAllTranslations)
   */
  <T> Map<String, String> getTranslations(Translatable<T> entity, String languageCode);

  /**
   * Get available languages for an entity
   */
  <T> Set<String> getAvailableLanguages(Translatable<T> entity);

  /**
   * Add a translation (alias for saveTranslation)
   */
  <T> void addTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

  /**
   * Get entity translations by type and ID
   */
  Map<String, Object> getEntityTranslations(String entityType, Long entityId);

  /**
   * Get a translatable proxy for an entity
   */
  Optional<Translatable> getTranslatable(String entityType, Long entityId);

  /**
   * Check if the translation service is available
   */
  boolean isAvailable();

  /**
   * Detect the language of a text
   */
  String detectLanguage(String text);

  /**
   * Translate text from one language to another
   */
  String translate(String text, String sourceLanguage, String targetLanguage);

  /**
   * Check if translation iteration should continue
   */
  boolean shouldContinueIteration();

  /**
   * Check if translation iteration should continue with parameters
   */
  boolean shouldContinueIteration(int iteration, Double completionRate, String qualityMetric);
}