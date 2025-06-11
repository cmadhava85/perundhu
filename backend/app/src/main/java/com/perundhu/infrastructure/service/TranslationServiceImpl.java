package com.perundhu.infrastructure.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.TranslationService;
import com.perundhu.domain.port.LocationRepository;

@Service
public class TranslationServiceImpl implements TranslationService {
    
    private static final Logger log = LoggerFactory.getLogger(TranslationServiceImpl.class);
    private final TranslationRepository translationRepository;
    private final LocationRepository locationRepository;
    
    public TranslationServiceImpl(TranslationRepository translationRepository, LocationRepository locationRepository) {
        this.translationRepository = translationRepository;
        this.locationRepository = locationRepository;
    }
    
    @Override
    public <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode) {
        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();
        
        log.debug("Looking up translation: entity={}, id={}, field={}, lang={}",
                 entityType, entityId, fieldName, languageCode);
        
        // Skip translation lookup for null or empty language codes
        if (languageCode == null || languageCode.isEmpty() || "en".equals(languageCode)) {
            String defaultValue = entity.getDefaultValue(fieldName);
            log.debug("Using default value for English or null language: {}", defaultValue);
            return defaultValue;
        }
        
        // 1. Try database translation first
        Optional<Translation> translation = translationRepository.findTranslation(
            entityType, entityId, languageCode, fieldName);
        
        if (translation.isPresent()) {
            String value = translation.get().getTranslatedValue();
            log.debug("Found translation in database: {}", value);
            return value;
        }
        
        log.debug("No direct translation found in database");

        // 2. For Stop entities, try Location translation
        if (entity instanceof Stop stop) {
            Location location = stop.getLocation();
            if (location != null) {
                log.debug("Trying location translation for stop with location ID {}", location.getEntityId());
                
                Optional<Translation> locationTranslation = translationRepository.findTranslation(
                    location.getEntityType(), location.getEntityId(), languageCode, fieldName);
                
                if (locationTranslation.isPresent()) {
                    String value = locationTranslation.get().getTranslatedValue();
                    log.debug("Found location translation: {}", value);
                    return value;
                } else {
                    log.debug("No location translation found");
                }
            }
        }

        // 3. Try entity's in-memory translations list
        if (entity.getTranslations() != null && !entity.getTranslations().isEmpty()) {
            log.debug("Checking entity's {} in-memory translations", entity.getTranslations().size());
            
            Optional<String> inMemoryTranslation = entity.getTranslations().stream()
                .filter(t -> languageCode.equals(t.getLanguageCode()) && fieldName.equals(t.getFieldName()))
                .map(Translation::getTranslatedValue)
                .findFirst();
                
            if (inMemoryTranslation.isPresent()) {
                String value = inMemoryTranslation.get();
                log.debug("Found in-memory translation: {}", value);
                return value;
            }
            log.debug("No matching in-memory translation found");
        } else {
            log.debug("Entity has no in-memory translations");
        }
        
        // 4. For locations directly query the translation table as a last resort
        if (entity instanceof Location && entityId != null) {
            log.debug("Directly querying translation table for location entity");
            List<Translation> allTranslations = translationRepository.findByEntityAndLanguage(
                "location", entityId, languageCode);
            
            log.debug("Found {} direct translations for location", allTranslations.size());
            
            Optional<Translation> directTranslation = allTranslations.stream()
                .filter(t -> fieldName.equals(t.getFieldName()))
                .findFirst();
                
            if (directTranslation.isPresent()) {
                String value = directTranslation.get().getTranslatedValue();
                log.debug("Found direct translation: {}", value);
                return value;
            }
        }
        
        // 5. Fallback to default value
        String defaultValue = entity.getDefaultValue(fieldName);
        log.debug("No translation found, returning default value: {}", defaultValue);
        return defaultValue;
    }
    
    @Override
    public <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode) {
        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();
        
        log.debug("Getting all translations for entity={}, id={}, lang={}",
                 entityType, entityId, languageCode);
        
        List<Translation> translations = translationRepository.findByEntityAndLanguage(
            entityType, entityId, languageCode);
        
        Map<String, String> translationMap = new HashMap<>();
        translations.forEach(t -> {
            translationMap.put(t.getFieldName(), t.getTranslatedValue());
            log.debug("Added translation for {}: {}", t.getFieldName(), t.getTranslatedValue());
        });
        
        // Also add in-memory translations if not already present
        if (entity.getTranslations() != null) {
            entity.getTranslations().stream()
                .filter(t -> languageCode.equals(t.getLanguageCode()))
                .forEach(t -> {
                    if (!translationMap.containsKey(t.getFieldName())) {
                        translationMap.put(t.getFieldName(), t.getTranslatedValue());
                        log.debug("Added in-memory translation for {}: {}", 
                                 t.getFieldName(), t.getTranslatedValue());
                    }
                });
        }
        
        // Directly query translations for locations (safeguard)
        if ("location".equals(entityType) && translationMap.isEmpty()) {
            log.debug("Translations map is empty, attempting direct query for location");
            List<Translation> directTranslations = translationRepository
                .findByEntityAndLanguage("location", entityId, languageCode);
                
            directTranslations.forEach(t -> {
                translationMap.put(t.getFieldName(), t.getTranslatedValue());
                log.debug("Added direct translation for {}: {}", t.getFieldName(), t.getTranslatedValue());
            });
        }
        
        return translationMap;
    }
    
    @Override
    public <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value) {
        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();
        
        log.debug("Saving translation: entity={}, id={}, field={}, lang={}, value={}",
                 entityType, entityId, fieldName, languageCode, value);
        
        Optional<Translation> existingTranslation = translationRepository.findTranslation(
            entityType, entityId, languageCode, fieldName);
        
        if (existingTranslation.isPresent()) {
            Translation translation = existingTranslation.get();
            Translation updatedTranslation = translation.withTranslatedValue(value);
            translationRepository.save(updatedTranslation);
            log.debug("Updated existing translation");
        } else {
            Translation newTranslation = Translation.builder()
                .entityType(entityType)
                .entityId(entityId)
                .languageCode(languageCode)
                .fieldName(fieldName)
                .translatedValue(value)
                .build();
            translationRepository.save(newTranslation);
            log.debug("Created new translation");
        }
        
        // Also update entity's in-memory translations
        entity.addTranslation(fieldName, languageCode, value);
    }
    
    @Override
    public <T> void deleteTranslation(Translatable<T> entity, String fieldName, String languageCode) {
        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();
        
        log.debug("Deleting translation: entity={}, id={}, field={}, lang={}",
                 entityType, entityId, fieldName, languageCode);
        
        translationRepository.findTranslation(entityType, entityId, languageCode, fieldName)
            .ifPresent(translationRepository::delete);
    }

    @Override
    public Map<String, Object> getEntityTranslations(String entityType, Long entityId) {
        log.debug("Getting translations for entity type: {} with ID: {}", entityType, entityId);
        
        Map<String, Object> result = new HashMap<>();
        result.put("entityType", entityType);
        result.put("entityId", entityId);
        
        Map<String, Map<String, String>> translations = new HashMap<>();
        translationRepository.findByEntity(entityType, entityId)
            .forEach(translation -> {
                translations.computeIfAbsent(translation.getLanguageCode(), k -> new HashMap<>())
                           .put(translation.getFieldName(), translation.getTranslatedValue());
            });
        
        result.put("translations", translations);
        return result;
    }

    @Override
    public Map<String, String> getTranslationsForNamespace(String language, String namespace) {
        log.debug("Getting translations for language: {} and namespace: {}", language, namespace);
        Map<String, String> translations = new HashMap<>();
        
        translationRepository.findByEntityAndLanguage(namespace, null, language)
            .forEach(translation -> 
                translations.put(translation.getFieldName(), translation.getTranslatedValue()));
        
        return translations;
    }

    @Override
    public Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces) {
        log.debug("Getting translations for language: {} and namespaces: {}", language, namespaces);
        Map<String, Map<String, String>> result = new HashMap<>();
        
        namespaces.forEach(namespace -> {
            Map<String, String> translations = getTranslationsForNamespace(language, namespace);
            if (!translations.isEmpty()) {
                result.put(namespace, translations);
            }
        });
        
        return result;
    }

    @Override
    public Map<String, Map<String, String>> getAllTranslations(String language) {
        log.debug("Getting all translations for language: {}", language);
        Map<String, Map<String, String>> result = new HashMap<>();
        
        translationRepository.findByEntityAndLanguage(null, null, language)
            .forEach(translation -> {
                result.computeIfAbsent(translation.getEntityType(), k -> new HashMap<>())
                      .put(translation.getFieldName(), translation.getTranslatedValue());
            });
        
        return result;
    }
}