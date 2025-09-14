package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.ApiResponse;
import com.perundhu.domain.model.Translatable;
import com.perundhu.domain.port.TranslationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

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
    public TranslationV1Controller(TranslationService translationService) {
        this.translationService = translationService;
    }

    /**
     * Get translatable entity
     * 
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @return API response with translatable entity
     */
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse> getTranslatable(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        log.info("Get translatable entity request for {}/{}", entityType, entityId);

        try {
            Optional<Translatable> translatable = translationService.getTranslatable(entityType, entityId);
            Map<String, Object> data = new HashMap<>();
            data.put("translatable", translatable.orElse(null));
            return ResponseEntity.ok(new ApiResponse("success", "Translatable entity retrieved successfully", data));
        } catch (Exception e) {
            log.error("Error retrieving translatable entity", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse("error", "Error retrieving translatable entity: " + e.getMessage()));
        }
    }

    /**
     * Get all translations for entity
     * 
     * @param entityType Entity type
     * @param entityId   Entity ID
     * @return API response with translations
     */
    @GetMapping("/{entityType}/{entityId}/translations")
    public ResponseEntity<ApiResponse> getEntityTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        log.info("Get translations request for {}/{}", entityType, entityId);

        try {
            Map<String, Object> translations = translationService.getEntityTranslations(entityType, entityId);
            return ResponseEntity.ok(new ApiResponse("success", "Translations retrieved successfully", translations));
        } catch (Exception e) {
            log.error("Error retrieving translations", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse("error", "Error retrieving translations: " + e.getMessage()));
        }
    }

    /**
     * Add a new translation
     * 
     * @param entityType   Entity type
     * @param entityId     Entity ID
     * @param fieldName    Field name
     * @param languageCode Language code
     * @param value        Translation value
     * @return API response with result
     */
    @PostMapping("/{entityType}/{entityId}/{fieldName}/{languageCode}")
    public ResponseEntity<ApiResponse> addTranslation(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String fieldName,
            @PathVariable String languageCode,
            @RequestBody String value) {

        log.info("Add translation request for {}/{}/{} in language {}", entityType, entityId, fieldName, languageCode);

        try {
            Optional<Translatable> translatableOpt = translationService.getTranslatable(entityType, entityId);
            if (translatableOpt.isPresent()) {
                translationService.addTranslation(translatableOpt.get(), fieldName, languageCode, value);
                Map<String, Object> data = new HashMap<>();
                data.put("entityType", entityType);
                data.put("entityId", entityId);
                data.put("fieldName", fieldName);
                data.put("languageCode", languageCode);
                data.put("value", value);
                return ResponseEntity.ok(new ApiResponse("success", "Translation added successfully", data));
            } else {
                return ResponseEntity.status(404).body(new ApiResponse("error", "Entity not found"));
            }
        } catch (Exception e) {
            log.error("Error adding translation", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse("error", "Error adding translation: " + e.getMessage()));
        }
    }

    /**
     * Delete a translation
     * 
     * @param entityType   Entity type
     * @param entityId     Entity ID
     * @param fieldName    Field name
     * @param languageCode Language code
     * @return API response with result
     */
    @DeleteMapping("/{entityType}/{entityId}/{fieldName}/{languageCode}")
    public ResponseEntity<ApiResponse> deleteTranslation(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @PathVariable String fieldName,
            @PathVariable String languageCode) {

        log.info("Delete translation request for {}/{}/{} in language {}", entityType, entityId, fieldName,
                languageCode);

        try {
            Optional<Translatable> translatableOpt = translationService.getTranslatable(entityType, entityId);
            if (translatableOpt.isPresent()) {
                boolean deleted = translationService.deleteTranslation(translatableOpt.get(), fieldName, languageCode);
                if (deleted) {
                    return ResponseEntity.ok(new ApiResponse("success", "Translation deleted successfully"));
                } else {
                    return ResponseEntity.status(404).body(new ApiResponse("error", "Translation not found"));
                }
            } else {
                return ResponseEntity.status(404).body(new ApiResponse("error", "Entity not found"));
            }
        } catch (Exception e) {
            log.error("Error deleting translation", e);
            return ResponseEntity.status(500)
                    .body(new ApiResponse("error", "Error deleting translation: " + e.getMessage()));
        }
    }
}
