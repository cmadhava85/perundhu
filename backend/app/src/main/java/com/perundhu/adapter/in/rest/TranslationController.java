package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.domain.port.TranslationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST API Controller for translations
 */
@RestController
@RequestMapping("/api/v1/translations")
@RequiredArgsConstructor
@Slf4j
public class TranslationController {

    private final TranslationService translationService;

    // Response record for translation errors
    private record TranslationError(String message, String reason) {}

    @GetMapping("/debug/entity/{entityType}/{entityId}")
    public ResponseEntity<Map<String, Object>> getEntityTranslations(
            @PathVariable String entityType,
            @PathVariable Long entityId) {

        log.info("Retrieving translations for {}: {}", entityType, entityId);
        var result = translationService.getEntityTranslations(entityType, entityId);

        return result.isEmpty() 
            ? ResponseEntity.notFound().build()
            : ResponseEntity.ok(result);
    }

    @GetMapping("/{language}/{namespace}")
    public ResponseEntity<Map<String, String>> getNamespaceTranslations(
            @PathVariable String language,
            @PathVariable String namespace) {

        log.info("Retrieving {} translations for namespace: {}", language, namespace);
        var translations = translationService.getTranslationsForNamespace(language, namespace);

        return translations.isEmpty() 
            ? ResponseEntity.notFound().build()
            : ResponseEntity.ok(translations);
    }

    @GetMapping("/{language}")
    public ResponseEntity<Map<String, Map<String, String>>> getAllTranslations(
            @PathVariable String language,
            @RequestParam(value = "namespaces", required = false) List<String> namespaces) {

        log.info("Retrieving all translations for language: {}", language);

        var allTranslations = switch (namespaces) {
            case null -> translationService.getAllTranslations(language);
            default -> {
                if (namespaces.isEmpty()) {
                    yield translationService.getAllTranslations(language);
                } else {
                    log.info("Filtering by namespaces: {}", namespaces);
                    yield translationService.getTranslationsForNamespaces(language, namespaces);
                }
            }
        };

        return allTranslations.isEmpty()
            ? ResponseEntity.notFound().build()
            : ResponseEntity.ok(allTranslations);
    }
}
