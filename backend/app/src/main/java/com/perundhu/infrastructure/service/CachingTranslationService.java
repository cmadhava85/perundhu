package com.perundhu.infrastructure.service;

import java.util.Map;

import com.perundhu.domain.model.Translatable;

/**
 * Service interface for managing translations with caching capabilities.
 */
public interface CachingTranslationService extends com.perundhu.domain.port.TranslationService {
    /**
     * Saves multiple translations for an entity across multiple languages and fields.
     *
     * @param entity The entity to translate
     * @param translations Map of language codes to field/translation pairs
     */
    <T> void saveTranslations(Translatable<T> entity, Map<String, Map<String, String>> translations);
}