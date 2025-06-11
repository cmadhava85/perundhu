package com.perundhu.infrastructure.service;

/**
 * Interface for entities that can be translated.
 * This serves as a proxy interface for objects that need translations.
 */
public interface TranslatableProxy {
    /**
     * Gets the unique identifier for this translatable entity.
     * 
     * @return The unique identifier as a String
     */
    String getEntityIdAsString();
    
    /**
     * Gets the type of entity being translated.
     * 
     * @return The entity type name
     */
    String getEntityType();
}