package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;

@Repository
public interface TranslationJpaRepository extends JpaRepository<TranslationJpaEntity, Long> {
    
    @Query("SELECT t FROM TranslationJpaEntity t WHERE t.entityType = :entityType AND t.entityId = :entityId AND t.languageCode = :languageCode AND t.fieldName = :fieldName")
    Optional<TranslationJpaEntity> findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
        @Param("entityType") String entityType, 
        @Param("entityId") Long entityId, 
        @Param("languageCode") String languageCode, 
        @Param("fieldName") String fieldName);
    
    @Query("SELECT t FROM TranslationJpaEntity t WHERE t.entityType = :entityType AND t.entityId = :entityId AND t.languageCode = :languageCode")
    List<TranslationJpaEntity> findByEntityTypeAndEntityIdAndLanguageCode(
        @Param("entityType") String entityType, 
        @Param("entityId") Long entityId, 
        @Param("languageCode") String languageCode);
    
    @Query("SELECT t FROM TranslationJpaEntity t WHERE t.entityType = :entityType AND t.entityId = :entityId")
    List<TranslationJpaEntity> findByEntityTypeAndEntityId(
        @Param("entityType") String entityType, 
        @Param("entityId") Long entityId);
        
    /**
     * Find translations by entity type and language code
     *
     * @param entityType The entity type
     * @param languageCode The language code
     * @return List of translations for the specified entity type and language
     */
    @Query("SELECT t FROM TranslationJpaEntity t WHERE t.entityType = :entityType AND t.languageCode = :languageCode")
    List<TranslationJpaEntity> findByEntityTypeAndLanguageCode(
        @Param("entityType") String entityType,
        @Param("languageCode") String languageCode);
}