package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.Translation;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.persistence.UniqueConstraint;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA entity for translations using Java 17 features (no Lombok, no Builder pattern)
 */
@Entity
@Table(name = "translations", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"entity_type", "entity_id", "language_code", "field_name"})
})
public class TranslationJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Entity type must not be blank")
    @Size(max = 50, message = "Entity type must not exceed 50 characters")
    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType;

    @NotNull(message = "Entity ID must not be null")
    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @NotBlank(message = "Language code must not be blank")
    @Size(max = 10, message = "Language code must not exceed 10 characters")
    @Column(name = "language_code", nullable = false, length = 10)
    private String languageCode;

    @NotBlank(message = "Field name must not be blank")
    @Size(max = 50, message = "Field name must not exceed 50 characters")
    @Column(name = "field_name", nullable = false, length = 50)
    private String fieldName;

    @NotBlank(message = "Translated value must not be blank")
    @Column(name = "translated_value", nullable = false, columnDefinition = "TEXT")
    private String translatedValue;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Default constructor (required by JPA)
    public TranslationJpaEntity() {}

    // All-args constructor using Java 17 compact style
    public TranslationJpaEntity(Long id, String entityType, Long entityId, String languageCode,
                               String fieldName, String translatedValue, LocalDateTime createdAt,
                               LocalDateTime updatedAt) {
        this.id = id;
        this.entityType = entityType;
        this.entityId = entityId;
        this.languageCode = languageCode;
        this.fieldName = fieldName;
        this.translatedValue = translatedValue;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Factory method for creating new translations (Java 17 style)
    public static TranslationJpaEntity of(String entityType, Long entityId, String languageCode,
                                         String fieldName, String translatedValue) {
        var now = LocalDateTime.now();
        return new TranslationJpaEntity(null, entityType, entityId, languageCode,
                                       fieldName, translatedValue, now, now);
    }

    // Factory method with timestamps
    public static TranslationJpaEntity of(String entityType, Long entityId, String languageCode,
                                         String fieldName, String translatedValue,
                                         LocalDateTime createdAt, LocalDateTime updatedAt) {
        return new TranslationJpaEntity(null, entityType, entityId, languageCode,
                                       fieldName, translatedValue, createdAt, updatedAt);
    }

    public Long getId() { return id; }
    public String getEntityType() { return entityType; }
    public Long getEntityId() { return entityId; }
    public String getLanguageCode() { return languageCode; }
    public String getFieldName() { return fieldName; }
    public String getTranslatedValue() { return translatedValue; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    public void setId(Long id) { this.id = id; }
    public void setEntityType(String entityType) { this.entityType = entityType; }
    public void setEntityId(Long entityId) { this.entityId = entityId; }
    public void setLanguageCode(String languageCode) { this.languageCode = languageCode; }
    public void setFieldName(String fieldName) { this.fieldName = fieldName; }
    public void setTranslatedValue(String translatedValue) { this.translatedValue = translatedValue; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // equals, hashCode, toString using Java 17 features
    @Override
    public boolean equals(Object obj) {
        return obj instanceof TranslationJpaEntity other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return String.format("""
            TranslationJpaEntity{
                id=%s,
                entityType='%s',
                entityId=%s,
                languageCode='%s',
                fieldName='%s',
                translatedValue='%s',
                createdAt=%s,
                updatedAt=%s
            }""",
            id, entityType, entityId, languageCode, fieldName,
            translatedValue, createdAt, updatedAt);
    }

    // Domain model conversion using Java 17 features
    public static TranslationJpaEntity fromDomainModel(Translation translation) {
        if (translation == null) return null;

        var now = LocalDateTime.now();
        return new TranslationJpaEntity(
            translation.getId() != null ? translation.getId().getValue() : null,
            translation.getEntityType(),
            translation.getEntityId(),
            translation.getLanguageCode(),
            translation.getFieldName(),
            translation.getTranslatedValue(),
            translation.getCreatedAt() != null ? translation.getCreatedAt() : now,
            translation.getUpdatedAt() != null ? translation.getUpdatedAt() : now
        );
    }

    public Translation toDomainModel() {
        return new Translation(
            new Translation.TranslationId(id),
            entityType,
            entityId,
            languageCode,
            fieldName,
            translatedValue,
            createdAt,
            updatedAt
        );
    }

    // Utility method for updating translation value (Java 17 style)
    public TranslationJpaEntity withUpdatedValue(String newValue) {
        this.translatedValue = newValue;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    // Check if translation is recently created (within last hour)
    public boolean isRecentlyCreated() {
        return createdAt != null && createdAt.isAfter(LocalDateTime.now().minusHours(1));
    }

    // Get a formatted display string for debugging
    public String toDisplayString() {
        return String.format("%s#%s.%s [%s] = '%s'",
            entityType, entityId, fieldName, languageCode, translatedValue);
    }
}
