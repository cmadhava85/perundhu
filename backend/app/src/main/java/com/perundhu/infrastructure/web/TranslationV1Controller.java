package com.perundhu.infrastructure.web;

import java.util.Map;

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
import com.perundhu.infrastructure.shared.LoggerUtil;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/api/v1/translations")
public class TranslationV1Controller {
    
    private static final LoggerUtil logger = LoggerUtil.getLogger(TranslationV1Controller.class);
    
    private final CachingTranslationService translationService;
    
    public TranslationV1Controller(CachingTranslationService translationService) {
        this.translationService = translationService;
    }
    
    @GetMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<Map<String, String>>> getTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam String languageCode) {
        try {
            LanguageCode langCode = new LanguageCode(languageCode);
            logger.debug("Getting translations for {}/{} in {}", entityType, entityId, languageCode);
            
            TranslatableProxyImpl proxy = new TranslatableProxyImpl(entityType, entityId);
            Map<String, String> translations = translationService.getAllTranslations((Translatable<?>) proxy, langCode.toString());
            return ResponseEntity.ok(ApiResponse.success("Translations retrieved successfully", translations));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid request", e.getMessage()));
        }
    }
    
    @PostMapping("/{entityType}/{entityId}")
    public ResponseEntity<ApiResponse<Void>> saveTranslation(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam String languageCode,
            @RequestParam String fieldName,
            @RequestBody String translatedValue) {
        try {
            LanguageCode langCode = new LanguageCode(languageCode);
            logger.debug("Saving translation for {}/{}/{}/{}", entityType, entityId, languageCode, fieldName);
            
            TranslatableProxyImpl proxy = new TranslatableProxyImpl(entityType, entityId);
            translationService.saveTranslation((Translatable<?>) proxy, fieldName, langCode.toString(), translatedValue);
            return ResponseEntity.ok(ApiResponse.success("Translation saved successfully", null));
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
        try {
            LanguageCode langCode = new LanguageCode(languageCode);
            logger.debug("Deleting translation for {}/{}/{}/{}", entityType, entityId, languageCode, fieldName);
            
            TranslatableProxyImpl proxy = new TranslatableProxyImpl(entityType, entityId);
            translationService.deleteTranslation((Translatable<?>) proxy, fieldName, langCode.toString());
            return ResponseEntity.ok(ApiResponse.success("Translation deleted successfully", null));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                .body(ApiResponse.error("Invalid request", e.getMessage()));
        }
    }
}