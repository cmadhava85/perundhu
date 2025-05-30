package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Repository;

import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.infrastructure.persistence.entity.TranslationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.TranslationJpaRepository;

@Repository
public class TranslationJpaRepositoryAdapter implements TranslationRepository {

    private final TranslationJpaRepository jpaRepository;

    public TranslationJpaRepositoryAdapter(TranslationJpaRepository jpaRepository) {
        this.jpaRepository = jpaRepository;
    }

    @Override
    public Optional<Translation> findTranslation(String entityType, Long entityId, String languageCode, String fieldName) {
        return jpaRepository.findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(entityType, entityId, languageCode, fieldName)
                .map(TranslationJpaEntity::toDomainModel);
    }

    @Override
    public List<Translation> findByEntityAndLanguage(String entityType, Long entityId, String languageCode) {
        return jpaRepository.findByEntityTypeAndEntityIdAndLanguageCode(entityType, entityId, languageCode)
                .stream()
                .map(TranslationJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<Translation> findByEntity(String entityType, Long entityId) {
        return jpaRepository.findByEntityTypeAndEntityId(entityType, entityId)
                .stream()
                .map(TranslationJpaEntity::toDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public Translation save(Translation translation) {
        TranslationJpaEntity entity = TranslationJpaEntity.fromDomainModel(translation);
        return jpaRepository.save(entity).toDomainModel();
    }

    @Override
    public void delete(Translation translation) {
        jpaRepository.findByEntityTypeAndEntityIdAndLanguageCodeAndFieldName(
                translation.getEntityType(),
                translation.getEntityId(),
                translation.getLanguageCode(),
                translation.getFieldName())
            .ifPresent(jpaRepository::delete);
    }
}
