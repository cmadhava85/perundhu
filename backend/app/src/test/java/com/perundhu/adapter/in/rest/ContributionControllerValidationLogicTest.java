package com.perundhu.adapter.in.rest;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for Tesseract validation LOGIC without requiring native Tesseract
 * library.
 * Tests the bus schedule content detection indicators.
 */
@DisplayName("Tesseract Validation Logic Tests")
class ContributionControllerValidationLogicTest {

  @Test
  @DisplayName("Should detect time patterns in text")
  void shouldDetectTimePatterns() {
    assertTrue(hasTimePattern("Bus arrives at 06:00 and 07:30"));
    assertTrue(hasTimePattern("Timings: 6:00 AM, 12:30 PM"));
    assertTrue(hasTimePattern("Schedule: 13:45, 14:00, 15:30"));
    assertTrue(hasTimePattern("06:00")); // Simple time
    assertTrue(hasTimePattern("Timings: 06:00  06:30  07:00")); // Multiple spaces
    assertFalse(hasTimePattern("No times here"));
    assertFalse(hasTimePattern("Random text 123"));
  }

  @Test
  @DisplayName("Should detect Chennai location keywords")
  void shouldDetectLocationKeywords() {
    assertTrue(hasLocationKeywords("Route from Adyar to Central"));
    assertTrue(hasLocationKeywords("Stops: MYLAPORE, Guindy, Koyambedu"));
    assertTrue(hasLocationKeywords("chennai central station"));
    assertFalse(hasLocationKeywords("Random location nowhere"));
    assertFalse(hasLocationKeywords("Some text"));
  }

  @Test
  @DisplayName("Should detect route numbers")
  void shouldDetectRouteNumbers() {
    assertTrue(hasRouteNumbers("Route 27M to Adyar"));
    assertTrue(hasRouteNumbers("Buses: 42C, 166UD, 520"));
    assertTrue(hasRouteNumbers("MTC 19B service"));
    assertFalse(hasRouteNumbers("No routes here"));
    assertFalse(hasRouteNumbers("Random text"));
  }

  @Test
  @DisplayName("Should validate text length")
  void shouldValidateTextLength() {
    assertTrue(hasSufficientLength("This is a long text with more than fifty characters in it for validation"));
    assertFalse(hasSufficientLength("Short"));
    assertFalse(hasSufficientLength(""));
  }

  @Test
  @DisplayName("Should detect Tamil script")
  void shouldDetectTamilScript() {
    assertTrue(hasTamilScript("நபஸ் 520 சென்னை"));
    assertTrue(hasTamilScript("Some English and நபஸ் text"));
    assertFalse(hasTamilScript("Only English text"));
    assertFalse(hasTamilScript("123456"));
  }

  @Test
  @DisplayName("Should pass validation with 2 or more indicators")
  void shouldPassWithTwoIndicators() {
    // Route number + location
    String text1 = "Route 166UD from Central Station to Airport";
    assertTrue(countIndicators(text1) >= 2);

    // Time + route number
    String text2 = "27M departs at 06:00, 06:30, 07:00";
    assertTrue(countIndicators(text2) >= 2);

    // Location + sufficient length
    String text3 = "This bus service operates from Adyar bus depot connecting various important locations";
    assertTrue(countIndicators(text3) >= 2);
  }

  @Test
  @DisplayName("Should fail validation with less than 2 indicators")
  void shouldFailWithOneIndicator() {
    // Only route number
    String text1 = "Route 166UD";
    assertTrue(countIndicators(text1) < 2);

    // Only location
    String text2 = "Adyar";
    assertTrue(countIndicators(text2) < 2);

    // No indicators
    String text3 = "Random text";
    assertTrue(countIndicators(text3) < 2);
  }

  @Test
  @DisplayName("Should handle full bus schedule correctly")
  void shouldHandleFullSchedule() {
    String fullSchedule = "Route 166UD Central to Airport - Timings: 06:00, 06:30, 07:00, 07:30, 08:00 - Stops: Adyar, Mylapore, Saidapet, Guindy - MTC Chennai Bus Service";

    // Should have at least 2 indicators to pass validation
    int count = countIndicators(fullSchedule);
    assertTrue(count >= 2, "Expected 2+ indicators for valid schedule, got " + count);
  }

  @Test
  @DisplayName("Should reject selfie/personal photo text")
  void shouldRejectSelfie() {
    String selfieText = "smile happy face beautiful day";
    int count = countIndicators(selfieText);
    assertTrue(count < 2, "Selfie text should have < 2 indicators, got " + count);
  }

  // Helper methods that replicate the validation logic

  private boolean hasTimePattern(String text) {
    if (text == null || text.isEmpty())
      return false;
    // Matches: HH:MM or H:MM format (with optional AM/PM)
    // Look for pattern anywhere in the text, including after "Timings:"
    return text.matches(".*\\b([0-1]?[0-9]|2[0-3]):[0-5][0-9]\\b.*") ||
        text.toLowerCase().contains("timing");
  }

  private boolean hasLocationKeywords(String text) {
    if (text == null || text.isEmpty())
      return false;
    String lowerText = text.toLowerCase();

    String[] locations = {
        "adyar", "mylapore", "central", "koyambedu", "guindy",
        "ambattur", "avadi", "chennai", "tambaram", "chrompet",
        "velachery", "saidapet", "nungambakkam", "anna nagar",
        "t nagar", "besant nagar", "egmore", "broadway"
    };

    for (String location : locations) {
      if (lowerText.contains(location)) {
        return true;
      }
    }
    return false;
  }

  private boolean hasRouteNumbers(String text) {
    if (text == null || text.isEmpty())
      return false;
    // Matches: digits followed by optional letters (27M, 166UD, 42C, 19B, 520)
    // Must have at least one digit followed by uppercase letter for MTC route
    // format
    return text.matches(".*\\b\\d{1,3}[A-Z]+\\b.*") || text.matches(".*\\b[45]\\d{2}\\b.*");
  }

  private boolean hasSufficientLength(String text) {
    if (text == null)
      return false;
    return text.length() >= 50;
  }

  private boolean hasTamilScript(String text) {
    if (text == null || text.isEmpty())
      return false;
    // Tamil Unicode range: U+0B80 to U+0BFF
    return text.matches(".*[\\u0B80-\\u0BFF]+.*");
  }

  private int countIndicators(String text) {
    int count = 0;
    if (hasTimePattern(text))
      count++;
    if (hasLocationKeywords(text))
      count++;
    if (hasRouteNumbers(text))
      count++;
    if (hasSufficientLength(text))
      count++;
    if (hasTamilScript(text))
      count++;
    return count;
  }
}
