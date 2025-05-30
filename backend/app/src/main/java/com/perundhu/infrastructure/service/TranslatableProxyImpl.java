package com.perundhu.infrastructure.service;

/**
 * Implementation of the TranslatableProxy interface.
 */
public class TranslatableProxyImpl implements TranslatableProxy {
    
    private final String entityType;
    private final String entityId;
    
    /**
     * Creates a new TranslatableProxyImpl.
     * 
     * @param entityType The type of entity
     * @param entityId The entity ID
     */
    public TranslatableProxyImpl(String entityType, String entityId) {
        this.entityType = entityType;
        this.entityId = entityId;
    }
    
    /**
     * Creates a new TranslatableProxyImpl with a Long ID that gets converted to a String.
     * 
     * @param entityType The type of entity
     * @param entityId The entity ID as Long
     */
    public TranslatableProxyImpl(String entityType, Long entityId) {
        this.entityType = entityType;
        this.entityId = entityId.toString();
    }
    
    @Override
    public String getEntityId() {
        return entityId;
    }
    
    @Override
    public String getEntityType() {
        return entityType;
    }
}