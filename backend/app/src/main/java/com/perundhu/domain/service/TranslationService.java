package com.perundhu.domain.service;

import java.util.List;
import java.util.Map;
import java.util.Set;

import com.perundhu.domain.model.Translatable;

/**
 * Domain service for translation operations.
 * This is part of the domain layer and provides business logic for
 * translations.
 * Following hexagonal architecture principles.
 */
public interface TranslationService {

  /**
   * Get translation for a specific entity field
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param fieldName    The field name
   * @param languageCode The language code
   * @return The translated value or default value
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
   * Save a translation for an entity field
   * 
   * @param <T>          Entity type
   * @param entity       The translatable entity
   * @param fieldName    The field name
   * @param languageCode The language code
   * @param value        The translated value
   */
  <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);

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
   * Get translations for specific namespaces
   * 
   * @param language   The language code
   * @param namespaces List of namespace names
   * @return Map of namespaces to translation maps
   */
  Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces);

  /**
   * Get translations for a specific namespace
   * 
   * @param language  The language code
   * @param namespace The namespace name
   * @return Map of keys to translated values
   */
  Map<String, String> getTranslationsForNamespace(String language, String namespace);

  /**
   * Translate text from one language to another
   * 
   * @param text           The text to translate
   * @param targetLanguage The target language code
   * @param sourceLanguage The source language code (optional)
   * @return The translated text
   */
  String translate(String text, String targetLanguage, String sourceLanguage);
}