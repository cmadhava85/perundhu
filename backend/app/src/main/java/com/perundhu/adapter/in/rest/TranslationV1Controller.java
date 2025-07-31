package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.ApiResponse;
import com.perundhu.domain.model.TranslatableProxy;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.service.TranslationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * REST API Controller for translation operations
 */
@RestController
@RequestMapping("/api/v1/translations")
public class TranslationV1Controller {

    private static final Logger log = LoggerFactory.getLogger(TranslationV1Controller.class);
    private final TranslationService translationService;

    /**
     * Constructor for dependency injection
     * 
     * @param translationService The translation service
     */
    public TranslationV1Controller(@Qualifier("domainTranslationService") TranslationService translationService) {
        this.translationService = translationService;
    }

    /**
     * Get translatable entity
     * 
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @param fieldName  Field name
     * @return API response with translatable entity
     */
    @GetMapping("/{entityType}/{entityId}/{fieldName}")
    public ResponseEntity<ApiResponse> getTranslatable(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String fieldName) {

        log.info("Get translatable entity request for {}/{}/{}", entityType, entityId, fieldName);

        try {
            TranslatableProxy translatable = translationService.getTranslatable(entityType, entityId, fieldName);
            Map<String, Object> data = new HashMap<>();
            data.put("translatable", translatable);
            return ResponseEntity.ok(new ApiResponse("success", "Translatable entity retrieved successfully", data));
        } catch (Exception e) {
            log.error("Error retrieving translatable entity", e);
            return ResponseEntity.status(500).body(new ApiResponse("error", e.getMessage()));
        }
    }

    /**
     * Get all translations for entity
     * 
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @param fieldName  Field name
     * @return API response with translations
     */
    @GetMapping("/{entityType}/{entityId}/{fieldName}/translations")
    public ResponseEntity<ApiResponse> getTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String fieldName) {

        log.info("Get translations request for {}/{}/{}", entityType, entityId, fieldName);

        try {
            List<Translation> translations = translationService.getTranslations(entityType, entityId, fieldName);
            Map<String, Object> data = new HashMap<>();
            data.put("translations", translations);
            return ResponseEntity.ok(new ApiResponse("success", "Translations retrieved successfully", data));
        } catch (Exception e) {
            log.error("Error retrieving translations", e);
            return ResponseEntity.status(500).body(new ApiResponse("error", e.getMessage()));
        }
    }

    /**
     * Add a new translation
     * 
     * @param translation The translation to add
     * @return API response with saved translation
     */
    @PostMapping
    public ResponseEntity<ApiResponse> addTranslation(@RequestBody Translation translation) {
        log.info("Add translation request for {}/{}/{} in language {}",
                translation.getEntityType(), translation.getEntityId(),
                translation.getFieldName(), translation.getLanguageCode());

        try {
            Translation saved = translationService.addTranslation(translation);
            Map<String, Object> data = new HashMap<>();
            data.put("translation", saved);
            return ResponseEntity.ok(new ApiResponse("success", "Translation added successfully", data));
        } catch (Exception e) {
            log.error("Error adding translation", e);
            return ResponseEntity.status(500).body(new ApiResponse("error", e.getMessage()));
        }
    }

    /**
     * Delete a translation
     * 
     * @param id The translation ID
     * @return API response with result
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse> deleteTranslation(@PathVariable Long id) {
        log.info("Delete translation request for ID {}", id);

        try {
            boolean deleted = translationService.deleteTranslation(id);
            if (deleted) {
                return ResponseEntity.ok(new ApiResponse("success", "Translation deleted successfully"));
            } else {
                return ResponseEntity.status(404).body(new ApiResponse("error", "Translation not found"));
            }
        } catch (Exception e) {
            log.error("Error deleting translation", e);
            return ResponseEntity.status(500).body(new ApiResponse("error", e.getMessage()));
        }
    }
}
