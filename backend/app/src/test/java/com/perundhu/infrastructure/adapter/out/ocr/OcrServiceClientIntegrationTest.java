package com.perundhu.infrastructure.adapter.out.ocr;

import static org.junit.jupiter.api.Assertions.*;
import static org.junit.jupiter.api.Assumptions.assumeTrue;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIf;

/**
 * Integration tests for OcrServiceClient.
 * These tests require the OCR service to be running on localhost:8081.
 * 
 * To run these tests:
 * 1. Start the OCR service: cd ocr-service && ./start.sh
 * 2. Run: ./gradlew test --tests "OcrServiceClientIntegrationTest"
 */
class OcrServiceClientIntegrationTest {

    private OcrServiceClient ocrServiceClient;

    @BeforeEach
    void setUp() {
        ocrServiceClient = new OcrServiceClient();
        // Inject default values using reflection since @Value won't work in unit tests
        try {
            var urlField = OcrServiceClient.class.getDeclaredField("ocrServiceUrl");
            urlField.setAccessible(true);
            urlField.set(ocrServiceClient, "http://localhost:8081");
            
            var timeoutField = OcrServiceClient.class.getDeclaredField("timeoutSeconds");
            timeoutField.setAccessible(true);
            timeoutField.set(ocrServiceClient, 60);
        } catch (Exception e) {
            throw new RuntimeException("Failed to set up test", e);
        }
    }

    boolean isOcrServiceRunning() {
        try {
            return ocrServiceClient.isAvailable();
        } catch (Exception e) {
            return false;
        }
    }

    @Test
    @DisplayName("Should check OCR service availability")
    void shouldCheckOcrServiceAvailability() {
        // This test always runs - it's checking the isAvailable method itself
        boolean available = ocrServiceClient.isAvailable();
        System.out.println("OCR Service available: " + available);
        // Just verify the method doesn't throw
        assertNotNull(Boolean.valueOf(available));
    }

    @Test
    @DisplayName("Should extract text from Tamil test image when OCR service is running")
    void shouldExtractTextFromTamilTestImage() {
        assumeTrue(isOcrServiceRunning(), "OCR service not running - skipping integration test");

        String testImagePath = System.getProperty("user.dir") + "/../ocr-service/tamil_test.png";
        Path path = Path.of(testImagePath);
        
        assumeTrue(Files.exists(path), "Tamil test image not found at: " + testImagePath);

        OcrServiceClient.OcrResult result = ocrServiceClient.extractText(testImagePath);

        assertNotNull(result, "OCR result should not be null");
        assertNotNull(result.getExtractedText(), "Extracted text should not be null");
        assertFalse(result.getExtractedText().isEmpty(), "Extracted text should not be empty");
        assertTrue(result.getConfidence() > 0, "Confidence should be greater than 0");
        assertFalse(result.getLines().isEmpty(), "Should extract multiple lines");

        System.out.println("=== OCR Extraction Results ===");
        System.out.println("Confidence: " + result.getConfidence());
        System.out.println("Lines: " + result.getLines().size());
        System.out.println("Extracted Text:\n" + result.getExtractedText());
        
        // Verify Tamil content was recognized
        String text = result.getExtractedText();
        assertTrue(
            text.contains("பேருந்து") || text.contains("நேரம்") || 
            text.contains("AM") || text.contains("Rameshwaram"),
            "Should recognize content from the Tamil test image"
        );
    }

    @Test
    @DisplayName("Should handle non-existent file gracefully")
    void shouldHandleNonExistentFile() {
        assumeTrue(isOcrServiceRunning(), "OCR service not running - skipping integration test");

        assertThrows(
            OcrServiceClient.OcrException.class,
            () -> ocrServiceClient.extractText("/non/existent/file.jpg"),
            "Should throw OcrException for non-existent file"
        );
    }

    @Test
    @DisplayName("Should extract text from bytes")
    void shouldExtractTextFromBytes() throws IOException {
        assumeTrue(isOcrServiceRunning(), "OCR service not running - skipping integration test");

        String testImagePath = System.getProperty("user.dir") + "/../ocr-service/tamil_test.png";
        Path path = Path.of(testImagePath);
        
        assumeTrue(Files.exists(path), "Tamil test image not found");

        byte[] imageBytes = Files.readAllBytes(path);
        OcrServiceClient.OcrResult result = ocrServiceClient.extractTextFromBytes(imageBytes, "tamil_test.png");

        assertNotNull(result, "OCR result should not be null");
        assertNotNull(result.getExtractedText(), "Extracted text should not be null");
        assertTrue(result.getConfidence() > 0.5, "Confidence should be reasonably high for clear image");
        
        System.out.println("Byte extraction - Confidence: " + result.getConfidence());
    }
}
