package com.perundhu.adapter.in.rest;

import java.util.Map;
import java.util.Optional;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.ApiResponse;
import com.perundhu.domain.model.LanguageCode;
import com.perundhu.domain.model.Translatable;
import com.perundhu.infrastructure.service.CachingTranslationService;
import com.perundhu.infrastructure.service.TranslatableProxyImpl;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST Controller for managing translations (v1 API endpoints)
 */
@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/translations")
@RequiredArgsConstructor
@Slf4j
public class TranslationV1Controller {

    private final CachingTranslationService translationService;

    // Using records for immutable request types
    private record TranslationRequest(String entityType, Long entityId, String languageCode) {}
    private record TranslationUpdateRequest(
        String entityType, Long entityId, String languageCode, String fieldName, String value) {}

    // Sealed interface for operation result
    private sealed interface OperationResult {
        record Success<T>(T data) implements OperationResult {}
        record Failure(String reason) implements OperationResult {}
    }

    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam String languageCode) {
            
        var request = new TranslationRequest(entityType, entityId, languageCode);
        log.debug("Getting translations for {}/{} in {}", 
            request.entityType(), request.entityId(), request.languageCode());

        return processTranslationOperation(request, 
            req -> translationService.getAllTranslations(
                createTranslatable(req.entityType(), req.entityId()),
                createLanguageCode(req.languageCode())
            ));
    }

    @PostMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<Void>> saveTranslation(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam String languageCode,
            @RequestParam String fieldName,
            @RequestBody String translatedValue) {
            
        var request = new TranslationUpdateRequest(
            entityType, entityId, languageCode, fieldName, translatedValue
        );
        
        log.debug("Saving translation for {}/{}/{}/{}", 
            request.entityType(), request.entityId(), 
            request.languageCode(), request.fieldName());

        try {
            var translatable = createTranslatable(request.entityType(), request.entityId());
            var langCode = createLanguageCode(request.languageCode());
            
            translationService.saveTranslation(
                translatable, 
                request.fieldName(), 
                langCode, 
                request.value()
            );
            
            return ResponseEntity.ok(ApiResponse.success(
                "Translation saved successfully", 
                null
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid request", e.getMessage()));
        }
    }

    @DeleteMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<Void>> deleteTranslation(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam String languageCode,
            @RequestParam String fieldName) {
            
        var request = new TranslationUpdateRequest(
            entityType, entityId, languageCode, fieldName, null
        );
        
        log.debug("Deleting translation for {}/{}/{}/{}", 
            request.entityType(), request.entityId(), 
            request.languageCode(), request.fieldName());

        try {
            var translatable = createTranslatable(request.entityType(), request.entityId());
            var langCode = createLanguageCode(request.languageCode());
            
            translationService.deleteTranslation(
                translatable, 
                request.fieldName(), 
                langCode
            );
            
            return ResponseEntity.ok(ApiResponse.success(
                "Translation deleted successfully", 
                null
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid request", e.getMessage()));
        }
    }
    
    // Helper methods using Java 17 features
    private <T, R> ResponseEntity<ApiResponse<R>> processTranslationOperation(
            T request, 
            java.util.function.Function<T, R> operation) {
        try {
            var result = operation.apply(request);
            return ResponseEntity.ok(ApiResponse.success(
                "Operation completed successfully", 
                result
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid request", e.getMessage()));
        }
    }
    
    private Translatable<?> createTranslatable(String entityType, Long entityId) {
        return new TranslatableProxyImpl(entityType, entityId);
    }
    
    private String createLanguageCode(String code) {
        return new LanguageCode(code).toString();
    }
}
