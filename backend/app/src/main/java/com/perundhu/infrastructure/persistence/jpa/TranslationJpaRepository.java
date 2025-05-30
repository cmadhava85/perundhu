package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;

@Repository
public interface TranslationJpaRepository extends JpaRepository<TranslationJpaEntity, Long> {
    
    Optional<TranslationJpaEntity> findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
        String entityType, Long entityId, String languageCode, String fieldName);
    
    List<TranslationJpaEntity> findByEntityTypeAndEntityIdAndLanguageCode(
        String entityType, Long entityId, String languageCode);
    
    List<TranslationJpaEntity> findByEntityTypeAndEntityId(String entityType, Long entityId);
}