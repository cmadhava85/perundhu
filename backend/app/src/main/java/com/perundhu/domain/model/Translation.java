package com.perundhu.domain.model;

import java.time.LocalDateTime;

/**
 * Model class for translations.
 * Represents a translation of a field in a specific language.
 * Immutable implementation using Java 17 features.
 */
public class Translation {

    private final TranslationId id;
    private final String entityType;
    private final Long entityId;
    private final String fieldName;
    private final String languageCode;
    private final String translatedValue;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;

    /**
     * Default constructor
     */
    public Translation() {
        this(null, null, null, null, null, null, LocalDateTime.now(), LocalDateTime.now());
    }

    /**
     * Constructor with all fields
     * 
     * @param entityType      Entity type
     * @param entityId        Entity ID
     * @param fieldName       Field name
     * @param languageCode    Language code
     * @param translatedValue Translated text
     */
    public Translation(String entityType, Long entityId, String fieldName, String languageCode,
            String translatedValue) {
        this(null, entityType, entityId, fieldName, languageCode, translatedValue,
                LocalDateTime.now(), LocalDateTime.now());
    }

    /**
     * Constructor with ID and all fields
     * 
     * @param id              Translation ID
     * @param entityType      Entity type
     * @param entityId        Entity ID
     * @param fieldName       Field name
     * @param languageCode    Language code
     * @param translatedValue Translated text
     * @param createdAt       Creation timestamp
     * @param updatedAt       Last update timestamp
     */
    public Translation(TranslationId id, String entityType, Long entityId, String fieldName,
            String languageCode, String translatedValue,
            LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.entityType = entityType;
        this.entityId = entityId;
        this.fieldName = fieldName;
        this.languageCode = languageCode;
        this.translatedValue = translatedValue;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    /**
     * Record class for Translation ID
     */
    public record TranslationId(Long value) {
        public Long getValue() {
            return value;
        }
    }

    public TranslationId getId() {
        return id;
    }

    public String getEntityType() {
        return entityType;
    }

    public Long getEntityId() {
        return entityId;
    }

    public String getFieldName() {
        return fieldName;
    }

    public String getLanguageCode() {
        return languageCode;
    }

    public String getTranslatedValue() {
        return translatedValue;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    /**
     * Create a new Translation with updated value and timestamp
     * 
     * @param newValue The new translated value
     * @return A new Translation instance with updated value
     */
    public Translation updateValue(String newValue) {
        return new Translation(this.id, this.entityType, this.entityId, this.fieldName,
                this.languageCode, newValue, this.createdAt, LocalDateTime.now());
    }

    /**
     * Create a new Translation with the specified ID
     *
     * @param id The new ID
     * @return A new Translation instance with the updated ID
     */
    public Translation setId(TranslationId id) {
        return new Translation(id, this.entityType, this.entityId, this.fieldName,
                this.languageCode, this.translatedValue, this.createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified entity type
     *
     * @param entityType The new entity type
     * @return A new Translation instance with the updated entity type
     */
    public Translation setEntityType(String entityType) {
        return new Translation(this.id, entityType, this.entityId, this.fieldName,
                this.languageCode, this.translatedValue, this.createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified entity ID
     *
     * @param entityId The new entity ID
     * @return A new Translation instance with the updated entity ID
     */
    public Translation setEntityId(Long entityId) {
        return new Translation(this.id, this.entityType, entityId, this.fieldName,
                this.languageCode, this.translatedValue, this.createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified field name
     *
     * @param fieldName The new field name
     * @return A new Translation instance with the updated field name
     */
    public Translation setFieldName(String fieldName) {
        return new Translation(this.id, this.entityType, this.entityId, fieldName,
                this.languageCode, this.translatedValue, this.createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified language code
     *
     * @param languageCode The new language code
     * @return A new Translation instance with the updated language code
     */
    public Translation setLanguageCode(String languageCode) {
        return new Translation(this.id, this.entityType, this.entityId, this.fieldName,
                languageCode, this.translatedValue, this.createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified translated value
     *
     * @param translatedValue The new translated value
     * @return A new Translation instance with the updated translated value
     */
    public Translation setTranslatedValue(String translatedValue) {
        return new Translation(this.id, this.entityType, this.entityId, this.fieldName,
                this.languageCode, translatedValue, this.createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified creation timestamp
     *
     * @param createdAt The new creation timestamp
     * @return A new Translation instance with the updated creation timestamp
     */
    public Translation setCreatedAt(LocalDateTime createdAt) {
        return new Translation(this.id, this.entityType, this.entityId, this.fieldName,
                this.languageCode, this.translatedValue, createdAt, this.updatedAt);
    }

    /**
     * Create a new Translation with the specified update timestamp
     *
     * @param updatedAt The new update timestamp
     * @return A new Translation instance with the updated update timestamp
     */
    public Translation setUpdatedAt(LocalDateTime updatedAt) {
        return new Translation(this.id, this.entityType, this.entityId, this.fieldName,
                this.languageCode, this.translatedValue, this.createdAt, updatedAt);
    }
}
