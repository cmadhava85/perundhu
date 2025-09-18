package com.perundhu.infrastructure.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationService;

/**
 * Stub implementation of TranslationService to satisfy dependency injection
 * This is a temporary implementation to allow tests to pass
 */
@Service
@Profile("test")
public class StubTranslationServiceImpl implements TranslationService {

  @Override
  public <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode) {
    return "Translated: " + fieldName;
  }

  @Override
  public <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode) {
    return new HashMap<>();
  }

  @Override
  public <T> Map<String, String> getTranslations(Translatable<T> entity, String languageCode) {
    return new HashMap<>();
  }

  @Override
  public <T> Set<String> getAvailableLanguages(Translatable<T> entity) {
    return Set.of("en", "ta");
  }

  @Override
  public Map<String, Map<String, String>> getAllTranslations(String language) {
    return new HashMap<>();
  }

  @Override
  public Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces) {
    return new HashMap<>();
  }

  @Override
  public Map<String, String> getTranslationsForNamespace(String language, String namespace) {
    return new HashMap<>();
  }

  @Override
  public <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value) {
    // No-op
  }

  @Override
  public Translation saveTranslation(Translation translation) {
    // Return the same translation for testing
    return translation;
  }

  @Override
  public <T> void saveTranslations(Translatable<T> entity, Map<String, Map<String, String>> translations) {
    // No-op
  }

  @Override
  public <T> void addTranslation(Translatable<T> entity, String fieldName, String languageCode,
      String translatedValue) {
    // No-op
  }

  @Override
  public <T> boolean deleteTranslation(Translatable<T> entity, String fieldName, String languageCode) {
    return false;
  }

  @Override
  public boolean isAvailable() {
    return true;
  }

  @Override
  public String detectLanguage(String text) {
    return "en";
  }

  @Override
  public String translate(String text, String sourceLanguage, String targetLanguage) {
    return text;
  }

  @Override
  public Map<String, Object> getEntityTranslations(String entityType, Long entityId) {
    return new HashMap<>();
  }

  @Override
  @SuppressWarnings("rawtypes")
  public Optional<Translatable> getTranslatable(String entityType, Long entityId) {
    return Optional.empty();
  }

  @Override
  public boolean shouldContinueIteration() {
    return false;
  }
}