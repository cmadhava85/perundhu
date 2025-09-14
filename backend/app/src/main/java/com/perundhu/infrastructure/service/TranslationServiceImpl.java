package com.perundhu.infrastructure.service;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.TranslationService;
import com.perundhu.infrastructure.config.TranslationProperties;

// Remove @Service annotation - managed by HexagonalConfig
public class TranslationServiceImpl implements TranslationService {

    private static final Logger log = LoggerFactory.getLogger(TranslationServiceImpl.class);
    private final TranslationRepository translationRepository;
    private final TranslationProperties translationProperties;

    public TranslationServiceImpl(TranslationRepository translationRepository,
            TranslationProperties translationProperties) {
        this.translationRepository = translationRepository;
        this.translationProperties = translationProperties;
    }

    public <T> String getTranslation(Translatable<T> entity, String fieldName, String languageCode) {
        if (entity == null) {
            log.warn("Null entity passed to getTranslation");
            return null;
        }

        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();

        log.debug("Looking up translation: entity={}, id={}, field={}, lang={}",
                entityType, entityId, fieldName, languageCode);

        if (languageCode == null || languageCode.isEmpty() || "en".equals(languageCode)) {
            return entity.getDefaultValue(fieldName);
        }

        return translationRepository.findTranslation(entityType, entityId, languageCode, fieldName)
                .map(Translation::getTranslatedValue)
                .or(() -> {
                    Location location = getRelatedLocation(entity);
                    if (location != null) {
                        return translationRepository.findTranslation(
                                location.getEntityType(),
                                location.getEntityId(),
                                languageCode,
                                fieldName)
                                .map(Translation::getTranslatedValue);
                    }
                    return Optional.empty();
                })
                .orElse(entity.getDefaultValue(fieldName));
    }

    private <T> Location getRelatedLocation(Translatable<T> entity) {
        try {
            if (entity instanceof Location) {
                return (Location) entity;
            }
            return null;
        } catch (Exception e) {
            log.warn("Error getting related location for entity: {}", e.getMessage());
            return null;
        }
    }

    public Translation getTranslation(String entityType, Long entityId, String fieldName, String language) {
        if (entityType == null || entityId == null || fieldName == null || language == null) {
            log.warn("Null parameters passed to getTranslation");
            return null;
        }

        return translationRepository.findTranslation(entityType, entityId, language, fieldName).orElse(null);
    }

    public Map<String, Map<String, String>> getTranslationsForNamespaces(String language, List<String> namespaces) {
        log.debug("Getting translations for namespaces: lang={}, namespaces={}", language, namespaces);

        Map<String, Map<String, String>> result = new HashMap<>();

        for (String namespace : namespaces) {
            Map<String, String> namespaceTranslations = getTranslationsForNamespace(language, namespace);
            if (!namespaceTranslations.isEmpty()) {
                result.put(namespace, namespaceTranslations);
            }
        }

        return result;
    }

    public Map<String, String> getTranslationsForNamespace(String language, String namespace) {
        log.debug("Getting translations for namespace: lang={}, namespace={}", language, namespace);

        List<Translation> translations = translationRepository.findByEntityTypeAndLanguage(namespace, language);
        Map<String, String> result = new HashMap<>();

        for (Translation translation : translations) {
            String key = translation.getFieldName();
            if (translation.getEntityId() != null) {
                key = translation.getEntityId() + "." + key;
            }
            result.put(key, translation.getTranslatedValue());
        }

        return result;
    }

    public <T> Map<String, String> getAllTranslations(Translatable<T> entity, String languageCode) {
        if (entity == null || languageCode == null) {
            log.warn("Null entity or language code passed to getAllTranslations");
            return new HashMap<>();
        }

        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();

        log.debug("Getting all translations for entity={}, id={}, lang={}",
                entityType, entityId, languageCode);

        Map<String, String> translationMap = new HashMap<>();

        List<Translation> translations = translationRepository.findByEntityAndLanguage(
                entityType, entityId, languageCode);

        translations.forEach(t -> {
            translationMap.put(t.getFieldName(), t.getTranslatedValue());
            log.debug("Added translation for {}: {}", t.getFieldName(), t.getTranslatedValue());
        });

        Location location = entity.getRelatedLocation();
        if (location != null && translationMap.isEmpty()) {
            log.debug("Checking related location translations for entity={}, location={}",
                    entityType, location.getEntityId());

            List<Translation> locationTranslations = translationRepository
                    .findByEntityAndLanguage(location.getEntityType(), location.getEntityId(), languageCode);

            locationTranslations.forEach(t -> {
                if (!translationMap.containsKey(t.getFieldName())) {
                    translationMap.put(t.getFieldName(), t.getTranslatedValue());
                    log.debug("Added related location translation for {}: {}",
                            t.getFieldName(), t.getTranslatedValue());
                }
            });
        }

        return translationMap;
    }

    @Override
    public <T> Map<String, String> getTranslations(Translatable<T> entity, String languageCode) {
        // This is an alias for getAllTranslations to maintain compatibility with the
        // interface
        return getAllTranslations(entity, languageCode);
    }

    public Map<String, Map<String, String>> getAllTranslations(String language) {
        log.debug("Getting all translations for language: {}", language);

        List<Translation> translations = translationRepository.findByLanguage(language);
        Map<String, Map<String, String>> result = new HashMap<>();

        for (Translation translation : translations) {
            Map<String, String> entityTranslations = result.computeIfAbsent(
                    translation.getEntityType(), k -> new HashMap<>());

            String key = translation.getFieldName();
            if (translation.getEntityId() != null) {
                key = translation.getEntityType() + "." + translation.getEntityId() + "." + key;
            }

            entityTranslations.put(key, translation.getTranslatedValue());
        }

        return result;
    }

    @Transactional
    public <T> void saveTranslation(Translatable<T> entity, String fieldName, String languageCode, String value) {
        if (entity == null || fieldName == null || languageCode == null) {
            log.warn("Null entity, field name, or language code passed to saveTranslation");
            return;
        }

        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();

        log.debug("Saving translation: entity={}, id={}, field={}, lang={}, value={}",
                entityType, entityId, fieldName, languageCode, value);

        Optional<Translation> existingTranslation = translationRepository.findTranslation(
                entityType, entityId, languageCode, fieldName);

        if (existingTranslation.isPresent()) {
            Translation translation = existingTranslation.get();
            translation.updateValue(value);
            translationRepository.save(translation);
            log.debug("Updated existing translation");
        } else {
            Translation newTranslation = new Translation(entityType, entityId, languageCode, fieldName, value);
            translationRepository.save(newTranslation);
            log.debug("Created new translation");
        }
    }

    @Override
    public <T> void addTranslation(Translatable<T> entity, String fieldName, String languageCode, String value) {
        // This method is an alias for saveTranslation with the same implementation
        saveTranslation(entity, fieldName, languageCode, value);
    }

    public Translation saveTranslation(Translation translation) {
        if (translation.getId() == null) {
            return addTranslation(translation);
        } else {
            return updateTranslation(translation.getId().getValue(), translation);
        }
    }

    public Translation addTranslation(Translation translation) {
        if (translation == null) {
            return null;
        }
        return translationRepository.save(translation);
    }

    public Translation updateTranslation(Long id, Translation translation) {
        if (id == null || translation == null) {
            return null;
        }

        // Use the nested TranslationId from Translation class instead of the standalone
        // TranslationId
        translation.setId(new Translation.TranslationId(id));
        return translationRepository.save(translation);
    }

    @Transactional
    public <T> boolean deleteTranslation(Translatable<T> entity, String fieldName, String languageCode) {
        if (entity == null || fieldName == null || languageCode == null) {
            log.warn("Null entity, field name, or language code passed to deleteTranslation");
            return false;
        }

        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();

        log.debug("Deleting translation: entity={}, id={}, field={}, lang={}",
                entityType, entityId, fieldName, languageCode);

        Optional<Translation> translation = translationRepository.findTranslation(
                entityType, entityId, languageCode, fieldName);

        if (translation.isPresent()) {
            translationRepository.delete(translation.get());
            log.debug("Deleted translation");
            return true;
        } else {
            log.warn("Translation not found for deletion");
            return false;
        }
    }

    public boolean deleteTranslation(Long id) {
        if (id == null) {
            return false;
        }

        try {
            // Use the Translation's ID class and repository's deleteById method
            translationRepository.delete(id);
            return true;
        } catch (Exception e) {
            log.error("Error deleting translation: {}", e.getMessage());
            return false;
        }
    }

    public List<String> getSupportedLanguages() {
        return translationProperties != null ? translationProperties.getSupportedLanguages()
                : List.of("en", "ta", "hi", "ml", "te", "kn");
    }

    public Map<String, String> getEntityTranslations(String type, Long id, String language) {
        if (type == null || id == null) {
            return Map.of();
        }

        List<Translation> translations = translationRepository.findByEntityAndLanguage(type, id, language);
        Map<String, String> result = new HashMap<>();

        for (Translation t : translations) {
            result.put(t.getFieldName(), t.getTranslatedValue());
        }

        return result;
    }

    @Override
    public boolean shouldContinueIteration() {
        log.debug("Checking if translation iteration should continue");

        double completionRate = getTranslationCompletionRate();
        double errorRate = getTranslationErrorRate();
        double qualityScore = getTranslationQualityScore();

        return completionRate < translationProperties.getCompletionThreshold()
                || (errorRate > translationProperties.getErrorThreshold()
                        && qualityScore < translationProperties.getQualityThreshold());
    }

    @Override
    public boolean shouldContinueIteration(int iteration, Double completionRate, String qualityMetric) {
        log.debug("Checking if translation iteration should continue: iteration={}, completion={}, quality={}",
                iteration, completionRate, qualityMetric);

        double completion = completionRate != null ? completionRate : getTranslationCompletionRate();
        double errorRate = getTranslationErrorRate();
        double qualityScore = getTranslationQualityScore();

        double completionThreshold = translationProperties != null ? translationProperties.getCompletionThreshold()
                : 0.95;
        double errorThreshold = translationProperties != null ? translationProperties.getErrorThreshold() : 0.1;
        double qualityThreshold = translationProperties != null ? translationProperties.getQualityThreshold() : 0.8;

        return completion < completionThreshold
                || (errorRate > errorThreshold
                        && qualityScore < qualityThreshold);
    }

    private double getTranslationCompletionRate() {
        return 0.85;
    }

    private double getTranslationErrorRate() {
        return 0.05;
    }

    private double getTranslationQualityScore() {
        return 0.9;
    }

    @Override
    public String detectLanguage(String text) {
        if (text == null || text.trim().isEmpty()) {
            log.warn("Null or empty text passed to detectLanguage");
            return "en";
        }

        log.debug("Detecting language for text: {}", text.length() > 50 ? text.substring(0, 50) + "..." : text);

        // Java 17 compatible approach with traditional if-else for Unicode detection
        if (text.matches(".*[\\u0B80-\\u0BFF].*")) {
            log.debug("Detected Tamil characters");
            return "ta";
        }

        if (text.matches(".*[\\u0900-\\u097F].*")) {
            log.debug("Detected Hindi/Devanagari characters");
            return "hi";
        }

        if (text.matches(".*[\\u0D00-\\u0D7F].*")) {
            log.debug("Detected Malayalam characters");
            return "ml";
        }

        if (text.matches(".*[\\u0C00-\\u0C7F].*")) {
            log.debug("Detected Telugu characters");
            return "te";
        }

        if (text.matches(".*[\\u0C80-\\u0CFF].*")) {
            log.debug("Detected Kannada characters");
            return "kn";
        }

        log.debug("No specific language detected, defaulting to English");
        return "en";
    }

    @Override
    public boolean isAvailable() {
        try {
            log.debug("Checking translation service availability");

            translationRepository.findByLanguage("en");

            log.debug("Translation service is available");
            return true;
        } catch (Exception e) {
            log.error("Translation service is not available: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public String translate(String text, String sourceLanguage, String targetLanguage) {
        if (text == null || text.trim().isEmpty()) {
            log.warn("Null or empty text passed to translate");
            return text;
        }

        if (sourceLanguage == null || targetLanguage == null) {
            log.warn("Null source or target language passed to translate");
            return text;
        }

        log.debug("Translating text from {} to {}: {}", sourceLanguage, targetLanguage,
                text.length() > 50 ? text.substring(0, 50) + "..." : text);

        if (sourceLanguage.equals(targetLanguage)) {
            return text;
        }

        if ("en".equals(targetLanguage)) {
            return text;
        }

        try {
            List<Translation> translations = translationRepository.findByLanguage(targetLanguage);
            for (Translation translation : translations) {
                if (text.equals(translation.getTranslatedValue()) || text.equals(translation.getFieldName())) {
                    return translation.getTranslatedValue();
                }
            }

            log.debug("No translation found for text, returning original");
            return text;
        } catch (Exception e) {
            log.error("Error during translation: {}", e.getMessage());
            return text;
        }
    }

    @Override
    public Map<String, Object> getEntityTranslations(String entityType, Long entityId) {
        if (entityType == null || entityId == null) {
            log.warn("Null entity type or entity ID passed to getEntityTranslations");
            return new HashMap<>();
        }

        log.debug("Getting entity translations for entityType={}, entityId={}", entityType, entityId);

        Map<String, Object> result = new HashMap<>();
        result.put("entityType", entityType);
        result.put("entityId", entityId);

        Map<String, String> translations = new HashMap<>();

        List<Translation> entityTranslations = translationRepository.findByEntityAndLanguage(entityType, entityId,
                null);

        for (Translation translation : entityTranslations) {
            String key = translation.getLanguageCode() + "." + translation.getFieldName();
            translations.put(key, translation.getTranslatedValue());
        }

        result.put("translations", translations);

        log.debug("Found {} translations for entity {}:{}", translations.size(), entityType, entityId);
        return result;
    }

    @Override
    public Optional<Translatable> getTranslatable(String entityType, Long entityId) {
        log.debug("Fetching translatable entity: type={}, id={}", entityType, entityId);

        // Implementation depends on how you map entity types to actual entities
        // This is a simplified placeholder implementation
        return Optional.empty();
    }

    @Override
    public <T> void saveTranslations(Translatable<T> entity, Map<String, Map<String, String>> translations) {
        if (entity == null || translations == null) {
            log.warn("Null entity or translations passed to saveTranslations");
            return;
        }

        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();

        log.debug("Saving multiple translations for entity={}, id={}", entityType, entityId);

        // Process translations by language code and field name
        translations.forEach((languageCode, fieldTranslations) -> {
            fieldTranslations.forEach((fieldName, value) -> {
                saveTranslation(entity, fieldName, languageCode, value);
                log.debug("Saved translation for language={}, field={}", languageCode, fieldName);
            });
        });
    }

    @Override
    public <T> Set<String> getAvailableLanguages(Translatable<T> entity) {
        if (entity == null) {
            log.warn("Null entity passed to getAvailableLanguages");
            return new HashSet<>(getSupportedLanguages());
        }

        String entityType = entity.getEntityType();
        Long entityId = entity.getEntityId();

        log.debug("Getting available languages for entity={}, id={}", entityType, entityId);

        // Find all translations for this entity
        List<Translation> entityTranslations = translationRepository.findByEntity(entityType, entityId);

        // Extract unique language codes
        Set<String> languages = entityTranslations.stream()
                .map(Translation::getLanguageCode)
                .collect(java.util.stream.Collectors.toSet());

        // Always ensure English is available as fallback
        languages.add("en");

        return languages;
    }
}
