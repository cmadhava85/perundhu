package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.domain.port.TranslationService;

/**
 * REST API Controller for translations
 */
@RestController
@RequestMapping("/api/v1/translations")
public class TranslationController {

    private static final Logger log = LoggerFactory.getLogger(TranslationController.class);

    private final TranslationService translationService;

    /**
     * Constructor for dependency injection
     * Replaces Lombok's @RequiredArgsConstructor
     */
    public TranslationController(TranslationService translationService) {
        this.translationService = translationService;
    }

    // Using sealed interface to restrict implementation types
    public sealed interface ApiResponse permits TranslationSuccess, TranslationError, TranslationIterationResponse {
        String getStatus();
    }

    // Using records for immutable data classes
    record TranslationSuccess(String status, Map<String, Object> data) implements ApiResponse {
        // Compact constructor with single parameter
        TranslationSuccess(Map<String, Object> data) {
            this("success", data);
        }

        @Override
        public String getStatus() {
            return status;
        }
    }

    record TranslationError(String status, String message) implements ApiResponse {
        // Compact constructor with single parameter
        TranslationError(String message) {
            this("error", message);
        }

        @Override
        public String getStatus() {
            return status;
        }
    }

    record TranslationIterationResponse(String status, boolean continueIteration, String message)
            implements ApiResponse {
        // Compact constructor with single parameter
        TranslationIterationResponse(boolean continueIteration) {
            this("iteration", continueIteration, continueIteration ? "Continuing iteration" : "Stopping iteration");
        }

        @Override
        public String getStatus() {
            return status;
        }
    }

    /**
     * Get supported languages
     */
    @GetMapping("/languages")
    public ResponseEntity<ApiResponse> getSupportedLanguages() {
        log.info("Getting supported languages");

        try {
            // Since getSupportedLanguages might not be available in this interface,
            // use a default set of languages
            List<String> languages = List.of("en", "ta", "hi", "ml", "te", "kn");

            // Check if the method is available through reflection
            try {
                var method = translationService.getClass().getMethod("getSupportedLanguages");
                if (method != null) {
                    @SuppressWarnings("unchecked")
                    List<String> supportedLangs = (List<String>) method.invoke(translationService);
                    if (supportedLangs != null && !supportedLangs.isEmpty()) {
                        languages = supportedLangs;
                    }
                }
            } catch (Exception ignored) {
                // Method not available, use default languages
            }

            return ResponseEntity.ok(new TranslationSuccess(Map.of("languages", languages)));
        } catch (Exception e) {
            log.error("Error getting supported languages", e);
            return ResponseEntity.status(500).body(new TranslationError("Failed to get languages: " + e.getMessage()));
        }
    }

    /**
     * Translate text
     */
    @GetMapping("/translate")
    public ResponseEntity<ApiResponse> translateText(
            @RequestParam("text") String text,
            @RequestParam("targetLang") String targetLang,
            @RequestParam(value = "sourceLang", required = false) String sourceLang) {

        log.info("Translating text to {}: {}", targetLang, text);

        try {
            String translatedText = translationService.translate(text, targetLang, sourceLang);

            return ResponseEntity.ok(new TranslationSuccess(Map.of(
                    "original", text,
                    "translated", translatedText,
                    "sourceLang", sourceLang != null ? sourceLang : "auto",
                    "targetLang", targetLang)));
        } catch (Exception e) {
            log.error("Translation error", e);
            return ResponseEntity.status(500).body(new TranslationError("Translation failed: " + e.getMessage()));
        }
    }

    /**
     * Get translation for entity
     */
    @GetMapping("/entity/{type}/{id}/{language}")
    public ResponseEntity<ApiResponse> getEntityTranslation(
            @PathVariable String type,
            @PathVariable String id,
            @PathVariable String language) {

        log.info("Getting translation for {} entity {} in language {}", type, id, language);

        try {
            // Convert id string to Long for the service call
            Long entityId;
            try {
                entityId = Long.parseLong(id);
            } catch (NumberFormatException e) {
                return ResponseEntity.badRequest().body(
                        new TranslationError("Invalid entity ID format: " + id));
            }

            var translations = translationService.getEntityTranslations(type, entityId);

            if (translations.isEmpty()) {
                return ResponseEntity.ok(new TranslationSuccess(Map.of(
                        "entityType", type,
                        "entityId", id,
                        "language", language,
                        "translations", Map.of(),
                        "message", "No translations available")));
            }

            return ResponseEntity.ok(new TranslationSuccess(Map.of(
                    "entityType", type,
                    "entityId", id,
                    "language", language,
                    "translations", translations)));
        } catch (Exception e) {
            log.error("Error getting entity translation", e);
            return ResponseEntity.status(500).body(
                    new TranslationError("Failed to get translations: " + e.getMessage()));
        }
    }

    /**
     * Get a random translation tip
     */
    @GetMapping("/tips/random")
    public ResponseEntity<ApiResponse> getRandomTranslationTip() {
        log.info("Getting random translation tip");

        // Sample translation tips
        List<String> tips = List.of(
                "Use context to understand the meaning of words that have multiple translations.",
                "Consider cultural nuances when translating idiomatic expressions.",
                "Some words are better left untranslated, especially proper names and culturally specific terms.",
                "Machine translation works best for simple, straightforward text.",
                "Always review machine translations for accuracy and natural flow.");

        // Select random tip using Math.random() instead of SecureRandom
        int randomIndex = (int) (Math.random() * tips.size());
        String randomTip = tips.get(randomIndex);

        return ResponseEntity.ok(new TranslationSuccess(Map.of("tip", randomTip)));
    }

    /**
     * Control whether to continue iterating translations
     * 
     * @param iterationCount Current iteration count
     * @param maxIterations  Maximum allowed iterations
     * @param quality        Current translation quality score (0-100)
     * @return Response indicating whether iteration should continue
     */
    @GetMapping("/iterate/basic")
    public ResponseEntity<ApiResponse> continueIteration(
            @RequestParam(value = "iterationCount", defaultValue = "1") int iterationCount,
            @RequestParam(value = "maxIterations", defaultValue = "5") int maxIterations,
            @RequestParam(value = "quality", defaultValue = "0") double quality) {

        log.info("Checking whether to continue translation iteration: count={}, max={}, quality={}",
                iterationCount, maxIterations, quality);

        // Logic to determine whether to continue iterating
        boolean shouldContinue = iterationCount < maxIterations && quality < 90;

        String logMessage = shouldContinue
                ? "Continuing translation iteration"
                : "Stopping translation iteration";

        log.info(logMessage + ": count={}, max={}, quality={}",
                iterationCount, maxIterations, quality);

        return ResponseEntity.ok(new TranslationIterationResponse(shouldContinue));
    }

    /**
     * Check if translation iteration should continue
     * This endpoint determines whether to continue iterating through translation
     * batches based on service-defined criteria
     */
    @GetMapping("/iterate/advanced")
    public ResponseEntity<ApiResponse> shouldContinueIteration(
            @RequestParam(value = "iterationCount", defaultValue = "1") int iterationCount,
            @RequestParam(value = "qualityScore", required = false) Double qualityScore,
            @RequestParam(value = "namespace", required = false) String namespace) {

        log.info("Checking if translation iteration should continue: iteration={}, quality={}, namespace={}",
                iterationCount, qualityScore, namespace);

        try {
            // Call the translation service to determine whether to continue
            boolean shouldContinue = translationService.shouldContinueIteration();

            // If advanced parameters are provided, use the overloaded method
            if (qualityScore != null || namespace != null) {
                shouldContinue = translationService.shouldContinueIteration(
                        iterationCount, qualityScore, namespace);
            }

            return ResponseEntity.ok(new TranslationIterationResponse(shouldContinue));
        } catch (Exception e) {
            log.error("Error determining iteration continuation", e);
            return ResponseEntity.status(500).body(
                    new TranslationError("Failed to evaluate iteration status: " + e.getMessage()));
        }
    }
}
