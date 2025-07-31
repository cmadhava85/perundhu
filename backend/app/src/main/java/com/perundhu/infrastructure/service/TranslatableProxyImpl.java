package com.perundhu.infrastructure.service;

import java.lang.reflect.Field;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.HashSet;
import java.util.stream.Collectors;

import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationService;

/**
 * Implementation that serves as a proxy for translatable entities.
 * This class implements Translatable<Object> interface directly
 * and provides methods compatible with TranslatableProxy.
 * Immutable implementation using Java 17 features.
 */
public final class TranslatableProxyImpl implements Translatable<Object> {
    private final String entityType;
    private final Long entityId;
    private final String stringEntityId;
    private final List<Translation> translations;
    private final Map<String, Object> translatedEntity;
    private final Set<String> availableLanguages;
    private final Object entity;

    // Thread-local instance for handling modifications in a thread-safe way
    private static final ThreadLocal<TranslatableProxyImpl> CURRENT_INSTANCE = new ThreadLocal<>();

    /**
     * Creates a new TranslatableProxyImpl with just entity type and ID
     * Used for simple proxies that don't need to interact with a real entity
     * 
     * @param entityType The entity type
     * @param entityId   The entity ID
     */
    public TranslatableProxyImpl(String entityType, Long entityId) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.stringEntityId = String.valueOf(entityId);
        this.translations = Collections.unmodifiableList(new ArrayList<>());
        Map<String, Object> tempMap = new HashMap<>();
        tempMap.put("id", entityId);
        tempMap.put("type", entityType);
        this.translatedEntity = Collections.unmodifiableMap(tempMap);
        Set<String> tempSet = new HashSet<>();
        tempSet.add("en"); // Default language
        this.availableLanguages = Collections.unmodifiableSet(tempSet);
        this.entity = null;
    }

    /**
     * Creates a new TranslatableProxyImpl with a translatable entity and
     * translation service.
     * 
     * @param entity             The translatable entity
     * @param translationService The translation service
     * @param languageCode       The language code
     */
    public TranslatableProxyImpl(Translatable<?> entity, TranslationService translationService, String languageCode) {
        this.entityType = entity.getEntityType();
        this.entityId = entity.getEntityId();
        this.stringEntityId = String.valueOf(entity.getEntityId());

        // Handle null translations gracefully with a fallback to empty list
        Map<String, Map<String, String>> translationsMap = entity.getTranslations();
        List<Translation> tempTranslations = new ArrayList<>();
        if (translationsMap != null) {
            translationsMap.forEach((field, langMap) -> {
                langMap.forEach((lang, value) -> {
                    tempTranslations.add(new Translation(
                            entityType,
                            entityId,
                            field,
                            lang,
                            value));
                });
            });
        }
        this.translations = Collections.unmodifiableList(tempTranslations);

        this.availableLanguages = Collections.unmodifiableSet(getEntityLanguages(translationService, entity));

        // Get all translations for this entity in the requested language
        Map<String, String> entityTranslations = getAllTranslations(translationService, entity, languageCode);

        // Create the translated entity representation
        this.translatedEntity = Collections.unmodifiableMap(createTranslatedEntity(entity, entityTranslations));
        this.entity = entity;
    }

    /**
     * Private constructor for creating a new instance with updated translations and
     * languages
     */
    private TranslatableProxyImpl(String entityType, Long entityId, String stringEntityId,
            List<Translation> translations, Map<String, Object> translatedEntity,
            Set<String> availableLanguages, Object entity) {
        this.entityType = entityType;
        this.entityId = entityId;
        this.stringEntityId = stringEntityId;
        this.translations = Collections.unmodifiableList(translations);
        this.translatedEntity = Collections.unmodifiableMap(translatedEntity);
        this.availableLanguages = Collections.unmodifiableSet(availableLanguages);
        this.entity = entity;
    }

    private Map<String, String> getAllTranslations(TranslationService service, Translatable<?> entity,
            String languageCode) {
        try {
            return service.getTranslations(entity, languageCode);
        } catch (Exception e) {
            // If there's an error, return an empty map
            return new HashMap<>();
        }
    }

    private Set<String> getEntityLanguages(TranslationService service, Translatable<?> entity) {
        try {
            return service.getAvailableLanguages(entity);
        } catch (Exception e) {
            // If there's an error, return a default language set
            return Set.of("en");
        }
    }

    private Map<String, Object> createTranslatedEntity(Translatable<?> entity, Map<String, String> translations) {
        Map<String, Object> result = new HashMap<>();
        // Add basic properties
        result.put("id", entity.getEntityId());
        result.put("type", entity.getEntityType());

        // Add translations
        result.put("translations", translations);

        return result;
    }

    /**
     * Returns the entity type.
     *
     * @return The entity type
     */
    @Override
    public String getEntityType() {
        return entityType;
    }

    /**
     * Returns the entity ID.
     *
     * @return The entity ID
     */
    @Override
    public Long getEntityId() {
        return entityId;
    }

    /**
     * Returns the entity ID as a string.
     *
     * @return The entity ID as a string
     */
    public String getEntityIdAsString() {
        return entityId.toString();
    }

    /**
     * Returns the default value for a field.
     *
     * @param fieldName The field name
     * @return The default value
     */
    @Override
    public String getDefaultValue(String fieldName) {
        if (entity == null) {
            return null;
        }

        try {
            Field field = entity.getClass().getDeclaredField(fieldName);
            field.setAccessible(true);
            Object value = field.get(entity);
            return value != null ? value.toString() : null;
        } catch (NoSuchFieldException | IllegalAccessException e) {
            return null;
        }
    }

    /**
     * Get translations for this entity
     * 
     * @return Map of field names to translations
     */
    @Override
    public Map<String, Map<String, String>> getTranslations() {
        Map<String, Map<String, String>> result = new HashMap<>();

        // Group translations by field name
        for (Translation translation : translations) {
            String fieldName = translation.getFieldName();
            String languageCode = translation.getLanguageCode();
            String value = translation.getTranslatedValue();

            result.computeIfAbsent(fieldName, k -> new HashMap<>())
                    .put(languageCode, value);
        }

        return Collections.unmodifiableMap(result);
    }

    /**
     * Set translations for this entity.
     * As this is an immutable class, we maintain the immutability pattern by
     * storing the
     * modified instance in a thread-local variable.
     * 
     * @param translationsMap Map of field names to translations
     */
    @Override
    public void setTranslations(Map<String, Map<String, String>> translationsMap) {
        // Create a new list of translations
        List<Translation> newTranslations = new ArrayList<>();

        // Add new translations
        translationsMap.forEach((fieldName, langMap) -> {
            langMap.forEach((languageCode, value) -> {
                newTranslations.add(new Translation(
                        entityType,
                        entityId,
                        fieldName,
                        languageCode,
                        value));
            });
        });

        // Create a new set of available languages
        Set<String> newAvailableLanguages = new HashSet<>();
        newAvailableLanguages.add("en"); // Always include default language
        newTranslations.forEach(t -> newAvailableLanguages.add(t.getLanguageCode()));

        // Store the new instance in thread local storage
        CURRENT_INSTANCE.set(new TranslatableProxyImpl(entityType, entityId, stringEntityId, newTranslations,
                translatedEntity, newAvailableLanguages, entity));
    }

    /**
     * Get the most recent instance after any modifications
     * 
     * @return The current instance (potentially modified)
     */
    public TranslatableProxyImpl getCurrentInstance() {
        TranslatableProxyImpl current = CURRENT_INSTANCE.get();
        return current != null ? current : this;
    }

    /**
     * Get translatable fields
     */
    @Override
    public Map<String, String> getTranslatableFields() {
        // Default implementation returns empty map
        return Collections.emptyMap();
    }

    /**
     * Creates a new instance with the given translation removed
     *
     * @param fieldName    The field name
     * @param languageCode The language code
     * @return A new TranslatableProxyImpl with the translation removed
     */
    public TranslatableProxyImpl withTranslationRemoved(String fieldName, String languageCode) {
        List<Translation> newTranslations = new ArrayList<>(translations);
        newTranslations.removeIf(t -> t.getFieldName().equals(fieldName) &&
                t.getLanguageCode().equals(languageCode));

        // Create a new set of available languages
        Set<String> newAvailableLanguages = new HashSet<>(availableLanguages);

        // Update available languages if needed
        if (newTranslations.stream().noneMatch(t -> t.getLanguageCode().equals(languageCode))) {
            newAvailableLanguages.remove(languageCode);
        }

        return new TranslatableProxyImpl(entityType, entityId, stringEntityId,
                newTranslations, translatedEntity, newAvailableLanguages, entity);
    }

    /**
     * Creates a new instance with the given translation removed
     *
     * @param translation The translation to remove
     * @return A new TranslatableProxyImpl with the translation removed
     */
    public TranslatableProxyImpl withTranslationRemoved(Translation translation) {
        if (translation == null) {
            return this;
        }

        List<Translation> newTranslations = new ArrayList<>(translations);
        newTranslations.remove(translation);

        // Create a new set of available languages
        Set<String> newAvailableLanguages = new HashSet<>(availableLanguages);

        // Update available languages if needed
        String languageCode = translation.getLanguageCode();
        if (newTranslations.stream().noneMatch(t -> t.getLanguageCode().equals(languageCode))) {
            newAvailableLanguages.remove(languageCode);
        }

        return new TranslatableProxyImpl(entityType, entityId, stringEntityId,
                newTranslations, translatedEntity, newAvailableLanguages, entity);
    }

    /**
     * Creates a new instance with the given translation added
     * 
     * @param translation The translation to add
     * @return A new TranslatableProxyImpl with the translation added
     */
    public TranslatableProxyImpl withTranslationAdded(Translation translation) {
        if (translation == null) {
            return this;
        }

        List<Translation> newTranslations = new ArrayList<>(translations);

        // Remove any existing translation for this field/language combination
        newTranslations.removeIf(t -> t.getFieldName().equals(translation.getFieldName()) &&
                t.getLanguageCode().equals(translation.getLanguageCode()));

        // Add the new translation
        newTranslations.add(translation);

        // Create a new set of available languages
        Set<String> newAvailableLanguages = new HashSet<>(availableLanguages);
        newAvailableLanguages.add(translation.getLanguageCode());

        return new TranslatableProxyImpl(entityType, entityId, stringEntityId,
                newTranslations, translatedEntity, newAvailableLanguages, entity);
    }

    /**
     * Implements the Translatable interface method
     * 
     * @param fieldName    The field name
     * @param languageCode The language code
     * @param value        The translated value
     * @return The created Translation object
     */
    @Override
    public Translation addTranslation(String fieldName, String languageCode, String value) {
        Translation translation = new Translation(
                entityType,
                entityId,
                fieldName,
                languageCode,
                value);

        // Store the new instance with this translation added in thread local storage
        CURRENT_INSTANCE.set(withTranslationAdded(translation));

        return translation;
    }

    /**
     * Returns the translated entity as a map.
     *
     * @return The translated entity as a map
     */
    public Map<String, Object> getTranslatedEntity() {
        if (entity == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> result = new HashMap<>();

        // Add all fields from the entity
        for (Field field : entity.getClass().getDeclaredFields()) {
            field.setAccessible(true);
            try {
                result.put(field.getName(), field.get(entity));
            } catch (IllegalAccessException e) {
                // Ignore fields that can't be accessed
            }
        }

        // Add translations
        Map<String, Map<String, String>> translationsMap = getTranslations();
        result.put("translations", translationsMap);

        return Collections.unmodifiableMap(result);
    }

    /**
     * Returns the set of available languages.
     *
     * @return The set of available languages
     */
    public Set<String> getAvailableLanguages() {
        return availableLanguages;
    }
}
