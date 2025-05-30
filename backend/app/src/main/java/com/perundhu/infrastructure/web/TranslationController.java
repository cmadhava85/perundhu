package com.perundhu.infrastructure.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.TranslationRepository;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/v1/translations")
@Slf4j
public class TranslationController {
    
    private final TranslationRepository translationRepository;
    
    public TranslationController(TranslationRepository translationRepository) {
        this.translationRepository = translationRepository;
    }
    
    @GetMapping("/debug/entity/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> getEntityTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId,
            @RequestParam(required = false, defaultValue = "ta") String languageCode) {
        
        log.info("Debugging translations for entity={}, id={}, language={}", 
                entityType, entityId, languageCode);
        
        // Get all translations for this entity and language
        List<Translation> translations = 
            translationRepository.findByEntityAndLanguage(entityType, entityId, languageCode);
        
        // Create response map
        Map<String, Object> response = new HashMap<>();
        response.put("entityType", entityType);
        response.put("entityId", entityId);
        response.put("languageCode", languageCode);
        response.put("translationsCount", translations.size());
        
        Map<String, String> translationValues = new HashMap<>();
        translations.forEach(t -> translationValues.put(t.getFieldName(), t.getTranslatedValue()));
        response.put("translations", translationValues);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/debug/all/{languageCode}")
    public ResponseEntity<List<Translation>> getAllTranslationsForLanguage(
            @PathVariable String languageCode) {
        
        log.info("Getting all translations for language={}", languageCode);
        
        // Here we need to implement a direct SQL query since the repository interface 
        // doesn't have a method for this
        
        // For now, we'll just return information about the language code
        Map<String, Object> response = new HashMap<>();
        response.put("message", "Direct translation lookup not implemented yet");
        response.put("languageCode", languageCode);
        
        return ResponseEntity.ok().build();
    }
}