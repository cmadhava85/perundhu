package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.Translation;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "translations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class TranslationJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @NotBlank(message = "Entity type must not be blank")
    private String entityType;
    
    @NotNull(message = "Entity ID must not be null")
    private Long entityId;
    
    @NotBlank(message = "Language code must not be blank")
    private String languageCode;
    
    @NotBlank(message = "Field name must not be blank")
    private String fieldName;
    
    @NotBlank(message = "Translated value must not be blank")
    private String translatedValue;
    
    /**
     * Custom constructor for test compatibility.
     * Creates a new entity with null id (for auto-generation)
     */
    public TranslationJpaEntity(String entityType, Long entityId, String fieldName, String languageCode, String translatedValue) {
        this(null, entityType, entityId, languageCode, fieldName, translatedValue);
    }
    
    public Translation toDomainModel() {
        return Translation.builder()
            .id(id)
            .entityType(entityType)
            .entityId(entityId)
            .languageCode(languageCode)
            .fieldName(fieldName)
            .translatedValue(translatedValue)
            .build();
    }
    
    public static TranslationJpaEntity fromDomainModel(Translation translation) {
        if (translation == null) return null;
        
        return TranslationJpaEntity.builder()
            .id(translation.getId())
            .entityType(translation.getEntityType())
            .entityId(translation.getEntityId())
            .languageCode(translation.getLanguageCode())
            .fieldName(translation.getFieldName())
            .translatedValue(translation.getTranslatedValue())
            .build();
    }
}

