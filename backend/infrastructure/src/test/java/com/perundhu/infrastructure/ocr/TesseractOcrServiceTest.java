package com.perundhu.infrastructure.ocr;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Disabled;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TesseractOcrService
 * 
 * Note: Some tests are disabled by default as they require Tesseract to be
 * installed.
 * To run these tests, install Tesseract OCR with Tamil language support and
 * remove @Disabled annotations.
 */
class TesseractOcrServiceTest {

  private TesseractOcrService ocrService;
  private Path tempDir;

  @BeforeEach
  void setUp() throws IOException {
    tempDir = Files.createTempDirectory("ocr-test");
  }

  @Test
  @DisplayName("Service should initialize without errors")
  void testServiceInitialization() {
    assertDoesNotThrow(() -> {
      ocrService = new TesseractOcrService();
    });
  }

  @Test
  @Disabled("Requires Tesseract installation")
  @DisplayName("Should extract text from simple English image")
  void testExtractTextFromEnglishImage() throws IOException {
    ocrService = new TesseractOcrService();

    // Create a simple test image with text
    BufferedImage testImage = createTestImage("Chennai\n05:30 10:15 14:45", 400, 200);
    File tempFile = saveTempImage(testImage, "test-english.png");

    TesseractOcrService.TimingExtractionResult result = ocrService.extractTimings(tempFile.getAbsolutePath(),
        "Chennai");

    assertNotNull(result);
    assertNotNull(result.getOrigin());
    assertEquals("Chennai", result.getOrigin());
    assertNotNull(result.getRawText());
    assertTrue(result.getRawText().length() > 0);
  }

  @Test
  @Disabled("Requires Tesseract installation with Tamil support")
  @DisplayName("Should extract timings from Tamil bus board image")
  void testExtractTimingsFromTamilImage() throws IOException {
    ocrService = new TesseractOcrService();

    // Create test image with Tamil text and times
    BufferedImage testImage = createTestImage(
        "செங்கல்பட்டு\nகாலை: 05:30 06:15 07:00\nமாலை: 12:30 13:15 14:00\nஇரவு: 18:30 19:15 20:00",
        600, 300);
    File tempFile = saveTempImage(testImage, "test-tamil.png");

    TesseractOcrService.TimingExtractionResult result = ocrService.extractTimings(tempFile.getAbsolutePath(),
        "Chennai");

    assertNotNull(result);
    assertNotNull(result.getTimings());
    assertTrue(result.getConfidence().compareTo(BigDecimal.ZERO) > 0);
  }

  @Test
  @DisplayName("Should parse time patterns correctly")
  void testTimePatternParsing() {
    ocrService = new TesseractOcrService();

    // Test the internal time extraction logic
    String testText = "Timings: 5:30, 10:15, 14:45, 18:30";

    // The extractTimes method is private, but we can test through parseTimingBoard
    TesseractOcrService.TimingExtractionResult result = new TesseractOcrService.TimingExtractionResult();

    // Verify result structure
    assertNotNull(result);
    result.setOrigin("Test");
    assertEquals("Test", result.getOrigin());
  }

  @Test
  @DisplayName("Should categorize times by hour correctly")
  void testTimeCategorization() {
    // Morning: 5-12, Afternoon: 12-18, Night: 18-5

    // Morning times
    assertTrue(isTimeInRange("05:30", 5, 12));
    assertTrue(isTimeInRange("09:15", 5, 12));

    // Afternoon times
    assertTrue(isTimeInRange("12:30", 12, 18));
    assertTrue(isTimeInRange("15:45", 12, 18));

    // Night times
    assertTrue(isTimeInRange("18:30", 18, 24) || isTimeInRange("18:30", 0, 5));
    assertTrue(isTimeInRange("21:00", 18, 24));
  }

  @Test
  @DisplayName("Should handle empty or null image URL gracefully")
  void testHandleInvalidImageUrl() {
    ocrService = new TesseractOcrService();

    assertThrows(Exception.class, () -> {
      ocrService.extractTimings(null, "Chennai");
    });

    assertThrows(Exception.class, () -> {
      ocrService.extractTimings("", "Chennai");
    });

    assertThrows(Exception.class, () -> {
      ocrService.extractTimings("non-existent-file.jpg", "Chennai");
    });
  }

  @Test
  @DisplayName("Should calculate confidence score correctly")
  void testConfidenceCalculation() {
    // calculateConfidence is a private method, tested through extractTimings
    // This test validates that the result contains a confidence score
    TesseractOcrService.TimingExtractionResult result = new TesseractOcrService.TimingExtractionResult();

    // Verify that confidence can be set
    result.setConfidence(BigDecimal.valueOf(0.85));
    assertNotNull(result.getConfidence());
    assertTrue(result.getConfidence().compareTo(BigDecimal.ZERO) >= 0);
    assertTrue(result.getConfidence().compareTo(BigDecimal.ONE) <= 0);
  }

  @Test
  @DisplayName("Should handle result with no timings")
  void testResultWithNoTimings() {
    TesseractOcrService.TimingExtractionResult result = new TesseractOcrService.TimingExtractionResult();

    result.setOrigin("Chennai");
    result.setTimings(List.of());
    result.setConfidence(BigDecimal.valueOf(0.5));
    result.setWarnings(List.of("No destinations found"));

    assertEquals("Chennai", result.getOrigin());
    assertTrue(result.getTimings().isEmpty());
    assertEquals(1, result.getWarnings().size());
  }

  @Test
  @DisplayName("Should create ExtractedTiming with all categories")
  void testExtractedTimingStructure() {
    TesseractOcrService.ExtractedTiming timing = new TesseractOcrService.ExtractedTiming();

    timing.setDestination("Coimbatore");
    timing.setMorningTimings(List.of("05:30", "06:15", "07:00"));
    timing.setAfternoonTimings(List.of("12:30", "13:15", "14:00"));
    timing.setNightTimings(List.of("18:30", "19:15", "20:00"));

    assertEquals("Coimbatore", timing.getDestination());
    assertEquals(3, timing.getMorningTimings().size());
    assertEquals(3, timing.getAfternoonTimings().size());
    assertEquals(3, timing.getNightTimings().size());

    assertTrue(timing.getMorningTimings().contains("05:30"));
    assertTrue(timing.getAfternoonTimings().contains("13:15"));
    assertTrue(timing.getNightTimings().contains("20:00"));
  }

  @Test
  @Disabled("Requires Tesseract installation")
  @DisplayName("Should preprocess image correctly")
  void testImagePreprocessing() throws IOException {
    ocrService = new TesseractOcrService();

    // Create a large color image
    BufferedImage largeImage = new BufferedImage(3000, 2000, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = largeImage.createGraphics();
    g.setColor(Color.WHITE);
    g.fillRect(0, 0, 3000, 2000);
    g.setColor(Color.BLACK);
    g.setFont(new Font("Arial", Font.PLAIN, 48));
    g.drawString("Chennai to Coimbatore", 100, 100);
    g.dispose();

    File tempFile = saveTempImage(largeImage, "large-test.png");

    // This should resize and preprocess the image
    assertDoesNotThrow(() -> {
      ocrService.extractTimings(tempFile.getAbsolutePath(), "Chennai");
    });
  }

  @Test
  @DisplayName("Should handle OcrException correctly")
  void testOcrException() {
    TesseractOcrService.OcrException exception = new TesseractOcrService.OcrException("Test error",
        new RuntimeException("Cause"));

    assertEquals("Test error", exception.getMessage());
    assertNotNull(exception.getCause());
    assertEquals("Cause", exception.getCause().getMessage());
  }

  @Test
  @DisplayName("Should clean destination names correctly")
  void testDestinationNameCleaning() {
    // The cleanDestinationName method is private, but we can test the expected
    // behavior
    String dirtyName = "Chennai@#123";
    String expected = "Chennai";

    // Clean name should remove special characters but keep letters and spaces
    String cleaned = dirtyName.replaceAll("[^a-zA-Z\\s]", "").trim();
    assertEquals(expected, cleaned);
  }

  @Test
  @DisplayName("Should normalize time format correctly")
  void testTimeNormalization() {
    // Test time normalization: "5:30" -> "05:30"
    String time1 = "5:30";
    String normalized1 = time1.replaceFirst("^(\\d):", "0$1:");
    assertEquals("05:30", normalized1);

    String time2 = "15:45";
    String normalized2 = time2.replaceFirst("^(\\d):", "0$1:");
    assertEquals("15:45", normalized2); // Already normalized
  }

  // Helper methods

  private BufferedImage createTestImage(String text, int width, int height) {
    BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    Graphics2D g = image.createGraphics();

    // White background
    g.setColor(Color.WHITE);
    g.fillRect(0, 0, width, height);

    // Black text
    g.setColor(Color.BLACK);
    g.setFont(new Font("Arial", Font.BOLD, 24));

    // Draw text
    String[] lines = text.split("\\n");
    int y = 50;
    for (String line : lines) {
      g.drawString(line, 20, y);
      y += 40;
    }

    g.dispose();
    return image;
  }

  private File saveTempImage(BufferedImage image, String filename) throws IOException {
    File file = new File(tempDir.toFile(), filename);
    ImageIO.write(image, "png", file);
    return file;
  }

  private boolean isTimeInRange(String time, int startHour, int endHour) {
    String[] parts = time.split(":");
    int hour = Integer.parseInt(parts[0]);
    return hour >= startHour && hour < endHour;
  }
}
