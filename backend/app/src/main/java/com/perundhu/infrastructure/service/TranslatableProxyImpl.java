package com.perundhu.infrastructure.service;

import java.util.ArrayList;
import java.util.List;

import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.model.Translation;

/**
 * Implementation that serves as a proxy for translatable entities.
 * This class implements both Translatable and TranslatableProxy interfaces.
 */
public class TranslatableProxyImpl implements Translatable<Object>, TranslatableProxy {
    
    private final String entityType;
    private final Long entityId;
    private final String stringEntityId;
    private final List<Translation> translations = new ArrayList<>();
    
    /**
     * Creates a new TranslatableProxyImpl.
     * 
     * @param entityType The type of entity
     * @param entityId The entity ID as String
     */
    public TranslatableProxyImpl(String entityType, String entityId) {
        this.entityType = entityType;
        this.stringEntityId = entityId;
        this.entityId = Long.parseLong(entityId);
    }
    
    /**
     * Creates a new TranslatableProxyImpl with a Long ID.
     * 
     * @param entityType The type of entity
     * @param entityId The entity ID as Long
     */
    public TranslatableProxyImpl(String entityType, Long entityId) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.stringEntityId = entityId.toString();
    }
    
    @Override
    public String getEntityType() {
        return entityType;
    }
    
    /**
     * Get entity ID as Long for Translatable interface
     */
    @Override
    public Long getEntityId() {
        return entityId;
    }
    
    /**
     * Implementation for TranslatableProxy interface
     * This returns the entity ID as a string
     */
    @Override
    public String getEntityIdAsString() {
        return stringEntityId;
    }
    
    @Override
    public String getDefaultValue(String fieldName) {
        return ""; // Default implementation returns empty string
    }
    
    @Override
    public List<Translation> getTranslations() {
        return translations;
    }
    
    @Override
    public void addTranslation(String fieldName, String languageCode, String value) {
        // Create a new translation and add it to the list
        translations.add(Translation.builder()
            .entityType(entityType)
            .entityId(entityId)
            .fieldName(fieldName)
            .languageCode(languageCode)
            .translatedValue(value)
            .build());
    }
}