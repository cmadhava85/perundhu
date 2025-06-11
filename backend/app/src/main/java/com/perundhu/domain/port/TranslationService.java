package com.perundhu.domain.port;

import java.util.List;
import java.util.Map;

import com.perundhu.domain.model.Translatable;

public interface TranslationService {
    <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode);
    <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode);
    <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);
    <T> void deleteTranslation(Translatable<T> entity, String fieldName, String languageCode);
    
    // Methods for TranslationController
    Map<String, Object> getEntityTranslations(String entityType, Long entityId);
    Map<String, String> getTranslationsForNamespace(String language, String namespace);
    Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces);
    Map<String, Map<String, String>> getAllTranslations(String language);
}