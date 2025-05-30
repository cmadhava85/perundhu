package com.perundhu.domain.port;

import java.util.Map;

import com.perundhu.domain.model.Translatable;

public interface TranslationService {
    <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode);
    <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode);
    <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value);
    <T> void deleteTranslation(Translatable<T> entity, String fieldName, String languageCode);
}