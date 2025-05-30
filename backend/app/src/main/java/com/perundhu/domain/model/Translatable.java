package com.perundhu.domain.model;

import java.util.ArrayList;
import java.util.List;

/**
 * Interface that must be implemented by all entities that support translations
 */
public interface Translatable<T> {
    /**
     * Gets the type of the translatable entity
     * @return entity type
     */
    String getEntityType();

    /**
     * Gets the numeric ID value for translation storage
     * @return Long ID for translation storage
     */
    Long getEntityId();

    /**
     * Gets the default value for a given field name
     * @param fieldName the name of the field
     * @return default value for the field
     */
    String getDefaultValue(String fieldName);

    /**
     * Gets the translation ID, defaulting to the entity ID
     * @return Long translation ID
     */
    default Long getTranslationId() {
        return getEntityId();
    }

    /**
     * Gets the list of translations
     * @return list of translations
     */
    default List<Translation> getTranslations() {
        return new ArrayList<>(); // Return an empty list by default instead of throwing an exception
    }

    /**
     * Adds a translation for a given field name, language code, and value
     * @param fieldName the name of the field
     * @param languageCode the language code
     * @param value the translation value
     */
    default void addTranslation(String fieldName, String languageCode, String value) {
        // Default implementation does nothing - should be overridden by classes that need it
        // Classes using this interface should override this method if they need to store translations
    }
    
    /**
     * Determines whether to continue iteration process
     * @return true if iteration should continue, false otherwise
     */
    default boolean continueToIterate() {
        return true; // By default, continue iteration
    }
}