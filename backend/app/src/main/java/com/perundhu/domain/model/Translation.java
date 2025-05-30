package com.perundhu.domain.model;

import lombok.Value;

@Value
public class Translation {
    Long id;
    String entityType;
    Long entityId;
    String languageCode;
    String fieldName;
    String translatedValue;
    
    public void setTranslatedValue(String translatedValue) {
        // This is a workaround for @Value which makes fields final
        // In a real implementation, you would use a builder pattern or a mutable class
        throw new UnsupportedOperationException("Cannot modify immutable object");
    }
}