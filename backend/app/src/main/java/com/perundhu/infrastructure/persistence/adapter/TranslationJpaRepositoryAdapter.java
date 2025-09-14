package com.perundhu.infrastructure.persistence.adapter;

import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;
import org.springframework.beans.factory.annotation.Qualifier;

import java.util.List;
import java.util.Optional;

// Remove @Component annotation - managed by HexagonalConfig
public class TranslationJpaRepositoryAdapter implements TranslationRepository {

    private final TranslationJpaRepository jpaRepository;

    public TranslationJpaRepositoryAdapter(
            @Qualifier("jpaPackageTranslationJpaRepository") TranslationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Translation> findTranslation(String entityType, Long entityId, String languageCode,
            String fieldName) {
        return jpaRepository.findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
                entityType, entityId, languageCode, fieldName)
                .map(TranslationJpaEntity::toDomainModel);
    }

    @Override
    public List<Translation> findByEntityAndLanguage(String entityType, Long entityId, String languageCode) {
        return jpaRepository.findByEntityTypeAndEntityIdAndLanguageCode(
                entityType, entityId, languageCode)
                .stream()
                .map(TranslationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Translation> findByEntity(String entityType, Long entityId) {
        return jpaRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(TranslationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public Translation save(Translation translation) {
        TranslationJpaEntity entity = TranslationJpaEntity.fromDomainModel(translation);
        TranslationJpaEntity saved = jpaRepository.save(entity);
        if (saved == null) {
            // If saving failed, return the original translation to avoid NPE
            return translation;
        }
        return saved.toDomainModel();
    }

    @Override
    public void delete(Translation translation) {
        if (translation.getId() != null && translation.getId().getValue() != null) {
            jpaRepository.deleteById(translation.getId().getValue());
        }
    }

    @Override
    public void delete(Long id) {
        if (id != null) {
            jpaRepository.deleteById(id);
        }
    }

    @Override
    public void deleteByEntity(String entityType, Long entityId) {
        jpaRepository.deleteByEntityTypeAndEntityId(entityType, entityId);
    }

    @Override
    public boolean exists(String entityType, Long entityId, String languageCode, String fieldName) {
        return jpaRepository.existsByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
                entityType, entityId, languageCode, fieldName);
    }

    @Override
    public Optional<Translation> findByEntityTypeAndEntityIdAndFieldNameAndLanguageCode(
            String entityType, Long entityId, String fieldName, String languageCode) {
        return jpaRepository.findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
                entityType, entityId, languageCode, fieldName)
                .map(TranslationJpaEntity::toDomainModel);
    }

    @Override
    public List<Translation> findByLanguage(String languageCode) {
        return jpaRepository.findByLanguageCode(languageCode)
                .stream()
                .map(TranslationJpaEntity::toDomainModel)
                .toList();
    }

    @Override
    public List<Translation> findByEntityTypeAndLanguage(String entityType, String languageCode) {
        return jpaRepository.findByEntityTypeAndLanguageCode(entityType, languageCode)
                .stream()
                .map(TranslationJpaEntity::toDomainModel)
                .toList();
    }
}
