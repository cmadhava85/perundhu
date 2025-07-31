package com.perundhu.domain.model;

import java.util.ArrayList;
import java.util.List;

public record Location(LocationId id, String name, Double latitude, Double longitude)
        implements Translatable<Location> {

    public static record LocationId(Long value) {
    }

    @Override
    public String getEntityType() {
        return "location";
    }

    @Override
    public Long getEntityId() {
        return id != null ? id.value() : null;
    }

    @Override
    public String getDefaultValue(String fieldName) {
        return "name".equals(fieldName) ? name : "";
    }

    // Helper method for compatibility with existing code
    public LocationId getId() {
        return id;
    }

    /**
     * Add translation for a field in this location
     * 
     * @param fieldName    Field name to translate
     * @param languageCode Language code
     * @param value        Translated value
     * @return Translation object created
     */
    public Translation addTranslation(String fieldName, String languageCode, String value) {
        return new Translation(
                getEntityType(),
                getEntityId(),
                fieldName,
                languageCode,
                value);
    }
}
