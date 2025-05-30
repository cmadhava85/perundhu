package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.LanguageCode;
import com.perundhu.domain.model.Translation;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "translations")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TranslationJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String entityType;
    private Long entityId;
    private String languageCode;
    private String fieldName;
    private String translatedValue;
    
    // Constructor used by CachingTranslationService
    public TranslationJpaEntity(
            String entityType, 
            Long entityId, 
            String fieldName, 
            LanguageCode languageCode, 
            String translatedValue) {
        this.id = null;
        this.entityType = entityType;
        this.entityId = entityId;
        this.languageCode = languageCode.toString();
        this.fieldName = fieldName;
        this.translatedValue = translatedValue;
    }
    
    public static TranslationJpaEntity fromDomainModel(Translation translation) {
        TranslationJpaEntity entity = new TranslationJpaEntity();
        entity.setId(translation.getId());
        entity.setEntityType(translation.getEntityType());
        entity.setEntityId(translation.getEntityId());
        entity.setLanguageCode(translation.getLanguageCode());
        entity.setFieldName(translation.getFieldName());
        entity.setTranslatedValue(translation.getTranslatedValue());
        return entity;
    }
    
    public Translation toDomainModel() {
        return new Translation(
            id,
            entityType,
            entityId,
            languageCode,
            fieldName,
            translatedValue
        );
    }
}