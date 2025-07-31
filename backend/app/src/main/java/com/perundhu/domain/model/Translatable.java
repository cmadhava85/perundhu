package com.perundhu.domain.model;

import java.util.Map;

/**
 * Interface for entities that can be translated
 */
public interface Translatable<T> {

    /**
     * Get the entity type for translation
     * 
     * @return Entity type string
     */
    String getEntityType();

    /**
     * Get the entity ID for translation
     * 
     * @return Entity ID
     */
    Long getEntityId();

    /**
     * Get default value for a field
     * 
     * @param fieldName Field name
     * @return Default value for the field
     */
    String getDefaultValue(String fieldName);

    /**
     * Get the translatable fields map
     * Key: field name, Value: original text
     * 
     * @return Map of field names to original text values
     */
    default Map<String, String> getTranslatableFields() {
        return Map.of();
    }

    /**
     * Get translations for this entity
     * 
     * @return Map of field names to translations
     */
    default Map<String, Map<String, String>> getTranslations() {
        return Map.of();
    }

    /**
     * Set translations for this entity
     * 
     * @param translations Map of field names to translations
     */
    default void setTranslations(Map<String, Map<String, String>> translations) {
        // Default implementation does nothing
    }

    /**
     * Add translation for a field
     * 
     * @param fieldName    Field name to translate
     * @param languageCode Language code
     * @param value        Translated value
     * @return Translation object created
     */
    Translation addTranslation(String fieldName, String languageCode, String value);

    /**
     * Get related location for this entity
     * This is used for fallback translations when the entity itself doesn't have
     * translations
     * 
     * @return Related location or null if none
     */
    default Location getRelatedLocation() {
        return null;
    }
}
