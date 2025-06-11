package com.perundhu.domain.model;

import lombok.Value;
import lombok.Builder;

/**
 * Immutable value object for translations
 */
@Value
@Builder
public class Translation {
    Long id;
    String entityType;
    Long entityId;
    String languageCode;
    String fieldName;
    String translatedValue;

    public Translation withTranslatedValue(String newValue) {
        return new Translation(id, entityType, entityId, languageCode, fieldName, newValue);
    }
}