package com.perundhu.infrastructure.adapter.out.persistence;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationRepository;

/**
 * In-memory implementation of TranslationRepository for testing/development
 * purposes.
 * This is a temporary adapter to resolve startup issues.
 * In production, this should be replaced with a proper JPA adapter.
 */
@Component("inMemoryTranslationRepository")
public class InMemoryTranslationRepositoryAdapter implements TranslationRepository {

  @Override
  public Optional<Translation> findTranslation(String entityType, Long entityId, String languageCode,
      String fieldName) {
    return Optional.empty();
  }

  @Override
  public List<Translation> findByEntityAndLanguage(String entityType, Long entityId, String languageCode) {
    return List.of();
  }

  @Override
  public List<Translation> findByEntity(String entityType, Long entityId) {
    return List.of();
  }

  @Override
  public Translation save(Translation translation) {
    return translation;
  }

  @Override
  public void delete(Translation translation) {
    // Do nothing
  }

  @Override
  public void delete(Long id) {
    // Do nothing
  }

  @Override
  public void deleteByEntity(String entityType, Long entityId) {
    // Do nothing
  }

  @Override
  public boolean exists(String entityType, Long entityId, String languageCode, String fieldName) {
    return false;
  }

  @Override
  public Optional<Translation> findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
      String entityType, Long entityId, String fieldName, String languageCode) {
    return Optional.empty();
  }

  @Override
  public List<Translation> findByLanguage(String languageCode) {
    return List.of();
  }

  @Override
  public List<Translation> findByEntityTypeAndLanguage(String entityType, String languageCode) {
    return List.of();
  }
}