package com.perundhu.infrastructure.persistence.jpa;

import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * JPA repository for Translation entities
 */
@Repository("jpaPackageTranslationJpaRepository")
public interface TranslationJpaRepository extends JpaRepository<TranslationJpaEntity, Long> {

    /**
     * Find a specific translation by entity, language, and field
     */
    Optional<TranslationJpaEntity> findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
            String entityType, Long entityId, String languageCode, String fieldName);

    /**
     * Find all translations for a specific entity and language
     */
    List<TranslationJpaEntity> findByEntityTypeAndEntityIdAndLanguageCode(
            String entityType, Long entityId, String languageCode);

    /**
     * Find all translations for a specific entity
     */
    List<TranslationJpaEntity> findByEntityTypeAndEntityId(String entityType, Long entityId);

    /**
     * Find all translations for a specific entity type and language
     */
    List<TranslationJpaEntity> findByEntityTypeAndLanguageCode(String entityType, String languageCode);

    /**
     * Delete all translations for a specific entity
     */
    void deleteByEntityTypeAndEntityId(String entityType, Long entityId);

    /**
     * Check if translation exists for entity, language, and field
     */
    boolean existsByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
            String entityType, Long entityId, String languageCode, String fieldName);

    /**
     * Find translations by entity type and field name
     */
    List<TranslationJpaEntity> findByEntityTypeAndFieldName(String entityType, String fieldName);

    /**
     * Find all translations by language code
     */
    List<TranslationJpaEntity> findByLanguageCode(String languageCode);
}
