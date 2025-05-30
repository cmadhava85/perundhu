package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.Translation;

public interface TranslationRepository {
    Optional<Translation> findTranslation(String entityType, Long entityId, String languageCode, String fieldName);
    List<Translation> findByEntityAndLanguage(String entityType, Long entityId, String languageCode);
    List<Translation> findByEntity(String entityType, Long entityId);
    Translation save(Translation translation);
    void delete(Translation translation);
}