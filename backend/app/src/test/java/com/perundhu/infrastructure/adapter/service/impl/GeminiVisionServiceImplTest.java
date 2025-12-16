package com.perundhu.infrastructure.adapter.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Unit tests for GeminiVisionServiceImpl.
 * 
 * Tests cover:
 * - Service availability checks
 * - Response parsing from pipe-delimited format
 * - Location name normalization
 * - Time normalization
 * - Error handling
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Gemini Vision Service Tests")
class GeminiVisionServiceImplTest {

  private GeminiVisionServiceImpl geminiVisionService;

  @BeforeEach
  void setUp() {
    geminiVisionService = new GeminiVisionServiceImpl();
  }

  @Nested
  @DisplayName("Service Availability Tests")
  class ServiceAvailabilityTests {

    @Test
    @DisplayName("Should return false when service is disabled")
    void shouldReturnFalseWhenDisabled() throws Exception {
      // Given
      setField(geminiVisionService, "enabled", false);
      setField(geminiVisionService, "apiKey", "test-api-key");

      // When
      boolean available = geminiVisionService.isAvailable();

      // Then
      assertThat(available).isFalse();
    }

    @Test
    @DisplayName("Should return false when API key is null")
    void shouldReturnFalseWhenApiKeyNull() throws Exception {
      // Given
      setField(geminiVisionService, "enabled", true);
      setField(geminiVisionService, "apiKey", null);

      // When
      boolean available = geminiVisionService.isAvailable();

      // Then
      assertThat(available).isFalse();
    }

    @Test
    @DisplayName("Should return false when API key is blank")
    void shouldReturnFalseWhenApiKeyBlank() throws Exception {
      // Given
      setField(geminiVisionService, "enabled", true);
      setField(geminiVisionService, "apiKey", "   ");

      // When
      boolean available = geminiVisionService.isAvailable();

      // Then
      assertThat(available).isFalse();
    }

    @Test
    @DisplayName("Should return true when enabled and API key configured")
    void shouldReturnTrueWhenEnabledAndConfigured() throws Exception {
      // Given
      setField(geminiVisionService, "enabled", true);
      setField(geminiVisionService, "apiKey", "valid-api-key");

      // When
      boolean available = geminiVisionService.isAvailable();

      // Then
      assertThat(available).isTrue();
    }
  }

  @Nested
  @DisplayName("Provider Name Tests")
  class ProviderNameTests {

    @Test
    @DisplayName("Should return provider name with model")
    void shouldReturnProviderNameWithModel() throws Exception {
      // Given
      setField(geminiVisionService, "modelName", "gemini-2.0-flash");

      // When
      String providerName = geminiVisionService.getProviderName();

      // Then
      assertThat(providerName).isEqualTo("gemini-gemini-2.0-flash");
    }

    @Test
    @DisplayName("Should return default model name")
    void shouldReturnDefaultModelName() throws Exception {
      // Given
      setField(geminiVisionService, "modelName", "gemini-1.5-flash");

      // When
      String providerName = geminiVisionService.getProviderName();

      // Then
      assertThat(providerName).contains("gemini-1.5-flash");
    }
  }

  @Nested
  @DisplayName("Error Response Tests")
  class ErrorResponseTests {

    @Test
    @DisplayName("Should return error when service not available - extractFromImage")
    void shouldReturnErrorWhenNotAvailable() throws Exception {
      // Given
      setField(geminiVisionService, "enabled", false);

      // When
      Map<String, Object> result = geminiVisionService.extractBusScheduleFromImage("http://example.com/image.jpg");

      // Then
      assertThat(result).containsKey("error");
      assertThat(result.get("error")).isEqualTo(true);
      assertThat(result.get("message")).isEqualTo("Gemini Vision service is not available");
    }

    @Test
    @DisplayName("Should return error when service not available - extractFromBase64")
    void shouldReturnErrorWhenNotAvailableBase64() throws Exception {
      // Given
      setField(geminiVisionService, "enabled", false);

      // When
      Map<String, Object> result = geminiVisionService.extractBusScheduleFromBase64("base64data", "image/jpeg");

      // Then
      assertThat(result).containsKey("error");
      assertThat(result.get("error")).isEqualTo(true);
      assertThat(result.get("message")).isEqualTo("Gemini Vision service is not available");
    }
  }

  @Nested
  @DisplayName("Pipe-Delimited Response Parsing Tests")
  class PipeDelimitedParsingTests {

    @Test
    @DisplayName("Should parse departure board format")
    void shouldParseDepartureBoardFormat() throws Exception {
      // Given
      String response = """
          ORIGIN:SIVAKASI
          TYPE:departure_board
          TIMES:01:10,01:20,02:00,03:30,04:15
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("SIVAKASI");
      assertThat(result.get("fromLocation")).isEqualTo("SIVAKASI");
      assertThat(result.get("boardType")).isEqualTo("departure_board");

      @SuppressWarnings("unchecked")
      List<String> times = (List<String>) result.get("allDepartureTimes");
      assertThat(times).containsExactly("01:10", "01:20", "02:00", "03:30", "04:15");
    }

    @Test
    @DisplayName("Should parse route schedule format")
    void shouldParseRouteScheduleFormat() throws Exception {
      // Given
      String response = """
          ORIGIN:MADURAI
          TYPE:route_schedule
          TIMES:
          ROUTES:
          166UD|CHENNAI|Dindigul,Trichy|06:00,14:30|EXPRESS
          520UD|BANGALORE|Salem,Krishnagiri|08:00,20:00|DELUXE
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("MADURAI");
      assertThat(result.get("boardType")).isEqualTo("route_schedule");

      @SuppressWarnings("unchecked")
      List<Map<String, Object>> routes = (List<Map<String, Object>>) result.get("routes");
      assertThat(routes).hasSize(2);

      // First route
      assertThat(routes.get(0).get("routeNumber")).isEqualTo("166UD");
      assertThat(routes.get(0).get("destination")).isEqualTo("CHENNAI");
      assertThat(routes.get(0).get("busType")).isEqualTo("EXPRESS");

      @SuppressWarnings("unchecked")
      List<String> via1 = (List<String>) routes.get(0).get("via");
      assertThat(via1).containsExactly("DINDIGUL", "TRICHY");

      @SuppressWarnings("unchecked")
      List<String> times1 = (List<String>) routes.get(0).get("departureTimes");
      assertThat(times1).containsExactly("06:00", "14:30");

      // Second route - BANGALORE should be normalized to BENGALURU
      assertThat(routes.get(1).get("routeNumber")).isEqualTo("520UD");
      assertThat(routes.get(1).get("destination")).isEqualTo("BENGALURU");
      assertThat(routes.get(1).get("busType")).isEqualTo("DELUXE");
    }

    @Test
    @DisplayName("Should handle markdown code blocks in response")
    void shouldHandleMarkdownCodeBlocks() throws Exception {
      // Given
      String response = """
          ```
          ORIGIN:CHENNAI
          TYPE:departure_board
          TIMES:05:30,06:00
          ROUTES:
          END
          ```
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("CHENNAI");

      @SuppressWarnings("unchecked")
      List<String> times = (List<String>) result.get("allDepartureTimes");
      assertThat(times).containsExactly("05:30", "06:00");
    }

    @Test
    @DisplayName("Should normalize single-digit hour times")
    void shouldNormalizeSingleDigitHourTimes() throws Exception {
      // Given
      String response = """
          ORIGIN:COIMBATORE
          TYPE:departure_board
          TIMES:5:30,9:15,10:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      @SuppressWarnings("unchecked")
      List<String> times = (List<String>) result.get("allDepartureTimes");
      assertThat(times).containsExactly("05:30", "09:15", "10:00");
    }

    @Test
    @DisplayName("Should handle empty routes section")
    void shouldHandleEmptyRoutesSection() throws Exception {
      // Given
      String response = """
          ORIGIN:TRICHY
          TYPE:departure_board
          TIMES:08:00,09:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("TRICHY");
      assertThat(result).doesNotContainKey("routes");

      @SuppressWarnings("unchecked")
      List<String> times = (List<String>) result.get("allDepartureTimes");
      assertThat(times).hasSize(2);
    }

    @Test
    @DisplayName("Should handle route with placeholder dashes")
    void shouldHandleRoutesWithPlaceholders() throws Exception {
      // Given
      String response = """
          ORIGIN:SIVAKASI
          TYPE:route_schedule
          TIMES:
          ROUTES:
          123|CHENNAI|-|10:00,15:00|-
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      @SuppressWarnings("unchecked")
      List<Map<String, Object>> routes = (List<Map<String, Object>>) result.get("routes");
      assertThat(routes).hasSize(1);
      assertThat(routes.get(0).get("routeNumber")).isEqualTo("123");
      assertThat(routes.get(0).get("destination")).isEqualTo("CHENNAI");
      assertThat(routes.get(0)).doesNotContainKey("via");
      assertThat(routes.get(0)).doesNotContainKey("busType");
    }
  }

  @Nested
  @DisplayName("Location Name Normalization Tests")
  class LocationNormalizationTests {

    @Test
    @DisplayName("Should normalize BANGALORE to BENGALURU")
    void shouldNormalizeBangalore() throws Exception {
      // Given
      String response = """
          ORIGIN:BANGALORE
          TYPE:departure_board
          TIMES:10:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("BENGALURU");
    }

    @Test
    @DisplayName("Should normalize MADRAS to CHENNAI")
    void shouldNormalizeMadras() throws Exception {
      // Given
      String response = """
          ORIGIN:MADRAS
          TYPE:departure_board
          TIMES:10:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("CHENNAI");
    }

    @Test
    @DisplayName("Should normalize TIRUCHIRAPPALLI to TRICHY")
    void shouldNormalizeTiruchirappalli() throws Exception {
      // Given
      String response = """
          ORIGIN:TIRUCHIRAPPALLI
          TYPE:departure_board
          TIMES:10:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("origin")).isEqualTo("TRICHY");
    }
  }

  @Nested
  @DisplayName("MIME Type Detection Tests")
  class MimeTypeDetectionTests {

    @Test
    @DisplayName("Should detect PNG MIME type")
    void shouldDetectPngMimeType() throws Exception {
      // When
      String mimeType = invokeGuessMimeType("http://example.com/image.png");

      // Then
      assertThat(mimeType).isEqualTo("image/png");
    }

    @Test
    @DisplayName("Should detect GIF MIME type")
    void shouldDetectGifMimeType() throws Exception {
      // When
      String mimeType = invokeGuessMimeType("http://example.com/image.gif");

      // Then
      assertThat(mimeType).isEqualTo("image/gif");
    }

    @Test
    @DisplayName("Should detect WebP MIME type")
    void shouldDetectWebpMimeType() throws Exception {
      // When
      String mimeType = invokeGuessMimeType("http://example.com/image.webp");

      // Then
      assertThat(mimeType).isEqualTo("image/webp");
    }

    @Test
    @DisplayName("Should default to JPEG MIME type")
    void shouldDefaultToJpegMimeType() throws Exception {
      // When
      String mimeType = invokeGuessMimeType("http://example.com/image.jpg");

      // Then
      assertThat(mimeType).isEqualTo("image/jpeg");
    }

    @Test
    @DisplayName("Should default to JPEG for unknown extension")
    void shouldDefaultToJpegForUnknown() throws Exception {
      // When
      String mimeType = invokeGuessMimeType("http://example.com/image.unknown");

      // Then
      assertThat(mimeType).isEqualTo("image/jpeg");
    }
  }

  @Nested
  @DisplayName("Integration Result Format Tests")
  class IntegrationResultFormatTests {

    @Test
    @DisplayName("Should include extractedBy field")
    void shouldIncludeExtractedByField() throws Exception {
      // Given
      String response = """
          ORIGIN:MADURAI
          TYPE:departure_board
          TIMES:10:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("extractedBy")).isEqualTo("gemini-vision");
    }

    @Test
    @DisplayName("Should include model field")
    void shouldIncludeModelField() throws Exception {
      // Given
      setField(geminiVisionService, "modelName", "gemini-2.0-flash");
      String response = """
          ORIGIN:CHENNAI
          TYPE:departure_board
          TIMES:10:00
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("model")).isEqualTo("gemini-2.0-flash");
    }

    @Test
    @DisplayName("Should set first time as departureTime")
    void shouldSetFirstTimeAsDepartureTime() throws Exception {
      // Given
      String response = """
          ORIGIN:SALEM
          TYPE:departure_board
          TIMES:06:30,07:00,08:15
          ROUTES:
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      assertThat(result.get("departureTime")).isEqualTo("06:30");
    }

    @Test
    @DisplayName("Should set fromLocation from route origin")
    void shouldSetFromLocationInRoutes() throws Exception {
      // Given
      String response = """
          ORIGIN:MADURAI
          TYPE:route_schedule
          TIMES:
          ROUTES:
          166|CHENNAI|Dindigul|10:00|EXPRESS
          END
          """;

      // When
      Map<String, Object> result = invokeParsePipeDelimitedResponse(response);

      // Then
      @SuppressWarnings("unchecked")
      List<Map<String, Object>> routes = (List<Map<String, Object>>) result.get("routes");
      assertThat(routes.get(0).get("fromLocation")).isEqualTo("MADURAI");
    }
  }

  // ==================== NEW VALIDATION METHOD TESTS ====================

  @Nested
  @DisplayName("Location Validation Tests")
  class LocationValidationTests {

    @Test
    @DisplayName("Should validate known Tamil Nadu locations")
    void shouldValidateKnownLocations() throws Exception {
      // Known locations should pass
      assertThat(invokeIsValidLocation("Chennai")).isTrue();
      assertThat(invokeIsValidLocation("MADURAI")).isTrue();
      assertThat(invokeIsValidLocation("Coimbatore")).isTrue();
      assertThat(invokeIsValidLocation("Trichy")).isTrue();
      assertThat(invokeIsValidLocation("Sivakasi")).isTrue();
      assertThat(invokeIsValidLocation("Aruppukkottai")).isTrue();
      assertThat(invokeIsValidLocation("Virudhunagar")).isTrue();
      assertThat(invokeIsValidLocation("Tirunelveli")).isTrue();
      assertThat(invokeIsValidLocation("Bengaluru")).isTrue();
      assertThat(invokeIsValidLocation("Kochi")).isTrue();
    }

    @Test
    @DisplayName("Should reject null and empty locations")
    void shouldRejectNullAndEmpty() throws Exception {
      assertThat(invokeIsValidLocation(null)).isFalse();
      assertThat(invokeIsValidLocation("")).isFalse();
      assertThat(invokeIsValidLocation("   ")).isFalse();
      assertThat(invokeIsValidLocation("-")).isFalse();
    }

    @Test
    @DisplayName("Should reject too short locations")
    void shouldRejectTooShort() throws Exception {
      assertThat(invokeIsValidLocation("A")).isFalse();
    }

    @Test
    @DisplayName("Should reject too long locations")
    void shouldRejectTooLong() throws Exception {
      String tooLong = "A".repeat(60);
      assertThat(invokeIsValidLocation(tooLong)).isFalse();
    }

    @Test
    @DisplayName("Should reject purely numeric strings")
    void shouldRejectPurelyNumeric() throws Exception {
      assertThat(invokeIsValidLocation("12345")).isFalse();
      assertThat(invokeIsValidLocation("000")).isFalse();
      assertThat(invokeIsValidLocation("9876543210")).isFalse();
    }

    @Test
    @DisplayName("Should accept known abbreviations")
    void shouldAcceptKnownAbbreviations() throws Exception {
      assertThat(invokeIsValidLocation("CMBT")).isTrue();
      assertThat(invokeIsValidLocation("KSRTC")).isTrue();
      assertThat(invokeIsValidLocation("TNSTC")).isTrue();
      assertThat(invokeIsValidLocation("SETC")).isTrue();
    }
  }

  @Nested
  @DisplayName("OCR Garbage Detection Tests")
  class OcrGarbageDetectionTests {

    @Test
    @DisplayName("Should detect OCR garbage patterns")
    void shouldDetectGarbagePatterns() throws Exception {
      // Special characters only
      assertThat(invokeIsOcrGarbage("@#$%")).isTrue();
      assertThat(invokeIsOcrGarbage("---")).isTrue();
      assertThat(invokeIsOcrGarbage("...")).isTrue();

      // Placeholder values
      assertThat(invokeIsOcrGarbage("NA")).isTrue();
      assertThat(invokeIsOcrGarbage("N/A")).isTrue();
      assertThat(invokeIsOcrGarbage("NIL")).isTrue();
      assertThat(invokeIsOcrGarbage("NULL")).isTrue();
      assertThat(invokeIsOcrGarbage("NONE")).isTrue();
      assertThat(invokeIsOcrGarbage("UNKNOWN")).isTrue();
      assertThat(invokeIsOcrGarbage("TBD")).isTrue();
    }

    @Test
    @DisplayName("Should detect just suffix words as garbage")
    void shouldDetectSuffixWordsAsGarbage() throws Exception {
      assertThat(invokeIsOcrGarbage("BUS")).isTrue();
      assertThat(invokeIsOcrGarbage("STAND")).isTrue();
      assertThat(invokeIsOcrGarbage("STATION")).isTrue();
      assertThat(invokeIsOcrGarbage("DEPOT")).isTrue();
      assertThat(invokeIsOcrGarbage("TERMINUS")).isTrue();
    }

    @Test
    @DisplayName("Should detect prepositions as garbage")
    void shouldDetectPrepositionsAsGarbage() throws Exception {
      assertThat(invokeIsOcrGarbage("THE")).isTrue();
      assertThat(invokeIsOcrGarbage("TO")).isTrue();
      assertThat(invokeIsOcrGarbage("FROM")).isTrue();
      assertThat(invokeIsOcrGarbage("VIA")).isTrue();
      assertThat(invokeIsOcrGarbage("AND")).isTrue();
    }

    @Test
    @DisplayName("Should detect single/double letters as garbage")
    void shouldDetectShortLettersAsGarbage() throws Exception {
      assertThat(invokeIsOcrGarbage("A")).isTrue();
      assertThat(invokeIsOcrGarbage("AB")).isTrue();
      assertThat(invokeIsOcrGarbage("X")).isTrue();
    }

    @Test
    @DisplayName("Should not flag valid location names as garbage")
    void shouldNotFlagValidLocations() throws Exception {
      assertThat(invokeIsOcrGarbage("Chennai")).isFalse();
      assertThat(invokeIsOcrGarbage("MADURAI")).isFalse();
      assertThat(invokeIsOcrGarbage("Coimbatore")).isFalse();
      assertThat(invokeIsOcrGarbage("Sivakasi")).isFalse();
      assertThat(invokeIsOcrGarbage("Kanyakumari")).isFalse();
    }

    @Test
    @DisplayName("Should handle null and empty strings")
    void shouldHandleNullEmpty() throws Exception {
      assertThat(invokeIsOcrGarbage(null)).isTrue();
      assertThat(invokeIsOcrGarbage("")).isTrue();
    }
  }

  @Nested
  @DisplayName("Excessive Repetition Detection Tests")
  class ExcessiveRepetitionTests {

    @Test
    @DisplayName("Should detect consecutive repeated characters")
    void shouldDetectConsecutiveRepeats() throws Exception {
      assertThat(invokeHasExcessiveRepetition("AAAA")).isTrue();
      assertThat(invokeHasExcessiveRepetition("BBBBB")).isTrue();
      assertThat(invokeHasExcessiveRepetition("XXXXXXXXX")).isTrue();
      assertThat(invokeHasExcessiveRepetition("HelloAAAAworld")).isTrue();
    }

    @Test
    @DisplayName("Should detect repeating 2-char patterns")
    void shouldDetectTwoCharPatterns() throws Exception {
      assertThat(invokeHasExcessiveRepetition("ABABAB")).isTrue();
      assertThat(invokeHasExcessiveRepetition("CDCDCD")).isTrue();
    }

    @Test
    @DisplayName("Should not flag normal text")
    void shouldNotFlagNormalText() throws Exception {
      assertThat(invokeHasExcessiveRepetition("Chennai")).isFalse();
      assertThat(invokeHasExcessiveRepetition("Madurai")).isFalse();
      assertThat(invokeHasExcessiveRepetition("COIMBATORE")).isFalse();
      assertThat(invokeHasExcessiveRepetition("Tirunelveli")).isFalse();
    }

    @Test
    @DisplayName("Should handle short strings")
    void shouldHandleShortStrings() throws Exception {
      // Strings less than 4 chars should return false
      assertThat(invokeHasExcessiveRepetition("AA")).isFalse();
      assertThat(invokeHasExcessiveRepetition("AAA")).isFalse();
      assertThat(invokeHasExcessiveRepetition("ABC")).isFalse();
    }
  }

  @Nested
  @DisplayName("Random String Detection Tests")
  class RandomStringDetectionTests {

    @Test
    @DisplayName("Should detect strings with too few vowels")
    void shouldDetectTooFewVowels() throws Exception {
      // These have very low vowel ratio
      assertThat(invokeLooksRandom("BCDFGHJK")).isTrue();
      assertThat(invokeLooksRandom("QWRTYPSD")).isTrue();
      assertThat(invokeLooksRandom("XYZPQRST")).isTrue();
    }

    @Test
    @DisplayName("Should not flag normal words")
    void shouldNotFlagNormalWords() throws Exception {
      // Note: looksRandom() expects uppercase input as it's called after toUpperCase()
      assertThat(invokeLooksRandom("CHENNAI")).isFalse();
      assertThat(invokeLooksRandom("MADURAI")).isFalse();
      assertThat(invokeLooksRandom("COIMBATORE")).isFalse();
      assertThat(invokeLooksRandom("TRICHY")).isFalse();
    }

    @Test
    @DisplayName("Should handle short strings")
    void shouldHandleShortStrings() throws Exception {
      // Strings less than 4 chars should return false
      assertThat(invokeLooksRandom("ABC")).isFalse();
      assertThat(invokeLooksRandom("XY")).isFalse();
    }

    @Test
    @DisplayName("Should not flag known abbreviations")
    void shouldNotFlagKnownAbbreviations() throws Exception {
      // Known abbreviations should pass even with low vowels
      assertThat(invokeLooksRandom("CMBT")).isFalse();
      assertThat(invokeLooksRandom("KSRTC")).isFalse();
    }
  }

  @Nested
  @DisplayName("Known Location Tests")
  class KnownLocationTests {

    @Test
    @DisplayName("Should recognize Tamil Nadu major cities")
    void shouldRecognizeTamilNaduCities() throws Exception {
      assertThat(invokeIsKnownLocation("CHENNAI")).isTrue();
      assertThat(invokeIsKnownLocation("MADURAI")).isTrue();
      assertThat(invokeIsKnownLocation("COIMBATORE")).isTrue();
      assertThat(invokeIsKnownLocation("TRICHY")).isTrue();
      assertThat(invokeIsKnownLocation("TIRUCHIRAPPALLI")).isTrue();
      assertThat(invokeIsKnownLocation("SALEM")).isTrue();
      assertThat(invokeIsKnownLocation("TIRUNELVELI")).isTrue();
      assertThat(invokeIsKnownLocation("THANJAVUR")).isTrue();
      assertThat(invokeIsKnownLocation("VELLORE")).isTrue();
      assertThat(invokeIsKnownLocation("ERODE")).isTrue();
      assertThat(invokeIsKnownLocation("TIRUPPUR")).isTrue();
      assertThat(invokeIsKnownLocation("THOOTHUKUDI")).isTrue();
    }

    @Test
    @DisplayName("Should recognize Tamil Nadu district towns")
    void shouldRecognizeDistrictTowns() throws Exception {
      assertThat(invokeIsKnownLocation("SIVAKASI")).isTrue();
      assertThat(invokeIsKnownLocation("VIRUDHUNAGAR")).isTrue();
      assertThat(invokeIsKnownLocation("ARUPPUKKOTTAI")).isTrue();
      assertThat(invokeIsKnownLocation("RAMANATHAPURAM")).isTrue();
      assertThat(invokeIsKnownLocation("RAMESWARAM")).isTrue();
      assertThat(invokeIsKnownLocation("THENI")).isTrue();
      assertThat(invokeIsKnownLocation("KARUR")).isTrue();
      assertThat(invokeIsKnownLocation("NAMAKKAL")).isTrue();
      assertThat(invokeIsKnownLocation("DINDIGUL")).isTrue();
      assertThat(invokeIsKnownLocation("KANYAKUMARI")).isTrue();
      assertThat(invokeIsKnownLocation("NAGERCOIL")).isTrue();
    }

    @Test
    @DisplayName("Should recognize Chennai areas")
    void shouldRecognizeChennaiAreas() throws Exception {
      assertThat(invokeIsKnownLocation("KOYAMBEDU")).isTrue();
      assertThat(invokeIsKnownLocation("TAMBARAM")).isTrue();
      assertThat(invokeIsKnownLocation("EGMORE")).isTrue();
      assertThat(invokeIsKnownLocation("BROADWAY")).isTrue();
      assertThat(invokeIsKnownLocation("GUINDY")).isTrue();
    }

    @Test
    @DisplayName("Should recognize Karnataka cities")
    void shouldRecognizeKarnatakaCities() throws Exception {
      assertThat(invokeIsKnownLocation("BENGALURU")).isTrue();
      assertThat(invokeIsKnownLocation("BANGALORE")).isTrue();
      assertThat(invokeIsKnownLocation("MYSURU")).isTrue();
      assertThat(invokeIsKnownLocation("MYSORE")).isTrue();
      assertThat(invokeIsKnownLocation("MANGALURU")).isTrue();
      assertThat(invokeIsKnownLocation("HUBBALLI")).isTrue();
      assertThat(invokeIsKnownLocation("HUBLI")).isTrue();
      assertThat(invokeIsKnownLocation("DHARWAD")).isTrue();
    }

    @Test
    @DisplayName("Should recognize Kerala cities")
    void shouldRecognizeKeralaCities() throws Exception {
      assertThat(invokeIsKnownLocation("THIRUVANANTHAPURAM")).isTrue();
      assertThat(invokeIsKnownLocation("TRIVANDRUM")).isTrue();
      assertThat(invokeIsKnownLocation("KOCHI")).isTrue();
      assertThat(invokeIsKnownLocation("COCHIN")).isTrue();
      assertThat(invokeIsKnownLocation("KOZHIKODE")).isTrue();
      assertThat(invokeIsKnownLocation("THRISSUR")).isTrue();
      assertThat(invokeIsKnownLocation("PALAKKAD")).isTrue();
      assertThat(invokeIsKnownLocation("KANNUR")).isTrue();
      assertThat(invokeIsKnownLocation("KOLLAM")).isTrue();
    }

    @Test
    @DisplayName("Should recognize Andhra Pradesh/Telangana cities")
    void shouldRecognizeApTsCities() throws Exception {
      assertThat(invokeIsKnownLocation("HYDERABAD")).isTrue();
      assertThat(invokeIsKnownLocation("VIJAYAWADA")).isTrue();
      assertThat(invokeIsKnownLocation("TIRUPATI")).isTrue();
      assertThat(invokeIsKnownLocation("VISAKHAPATNAM")).isTrue();
    }

    @Test
    @DisplayName("Should recognize bus stand codes")
    void shouldRecognizeBusStandCodes() throws Exception {
      assertThat(invokeIsKnownLocation("CMBT")).isTrue();
      assertThat(invokeIsKnownLocation("MGBS")).isTrue();
      assertThat(invokeIsKnownLocation("KSRTC")).isTrue();
      assertThat(invokeIsKnownLocation("TNSTC")).isTrue();
      assertThat(invokeIsKnownLocation("SETC")).isTrue();
    }

    @Test
    @DisplayName("Should be case insensitive")
    void shouldBeCaseInsensitive() throws Exception {
      assertThat(invokeIsKnownLocation("chennai")).isTrue();
      assertThat(invokeIsKnownLocation("Chennai")).isTrue();
      assertThat(invokeIsKnownLocation("CHENNAI")).isTrue();
      assertThat(invokeIsKnownLocation("ChEnNaI")).isTrue();
    }

    @Test
    @DisplayName("Should return false for unknown locations")
    void shouldReturnFalseForUnknown() throws Exception {
      assertThat(invokeIsKnownLocation("RANDOMPLACE")).isFalse();
      assertThat(invokeIsKnownLocation("FAKECITY")).isFalse();
      assertThat(invokeIsKnownLocation("XYZTOWN")).isFalse();
    }

    @Test
    @DisplayName("Should handle null and empty")
    void shouldHandleNullEmpty() throws Exception {
      assertThat(invokeIsKnownLocation(null)).isFalse();
      assertThat(invokeIsKnownLocation("")).isFalse();
      assertThat(invokeIsKnownLocation("   ")).isFalse();
    }
  }

  @Nested
  @DisplayName("Known Abbreviation Tests")
  class KnownAbbreviationTests {

    @Test
    @DisplayName("Should recognize transport corporation abbreviations")
    void shouldRecognizeTransportAbbreviations() throws Exception {
      assertThat(invokeIsKnownAbbreviation("CMBT")).isTrue();
      assertThat(invokeIsKnownAbbreviation("MGBS")).isTrue();
      assertThat(invokeIsKnownAbbreviation("KSRTC")).isTrue();
      assertThat(invokeIsKnownAbbreviation("TNSTC")).isTrue();
      assertThat(invokeIsKnownAbbreviation("SETC")).isTrue();
      assertThat(invokeIsKnownAbbreviation("APSRTC")).isTrue();
      assertThat(invokeIsKnownAbbreviation("MSRTC")).isTrue();
    }

    @Test
    @DisplayName("Should recognize bus operator abbreviations")
    void shouldRecognizeBusOperatorAbbreviations() throws Exception {
      assertThat(invokeIsKnownAbbreviation("KPN")).isTrue();
      assertThat(invokeIsKnownAbbreviation("SRM")).isTrue();
      assertThat(invokeIsKnownAbbreviation("VRL")).isTrue();
      assertThat(invokeIsKnownAbbreviation("SRS")).isTrue();
    }

    @Test
    @DisplayName("Should recognize station code abbreviations")
    void shouldRecognizeStationCodes() throws Exception {
      assertThat(invokeIsKnownAbbreviation("TPJ")).isTrue();
      assertThat(invokeIsKnownAbbreviation("MAS")).isTrue();
      assertThat(invokeIsKnownAbbreviation("CHN")).isTrue();
      assertThat(invokeIsKnownAbbreviation("CBE")).isTrue();
      assertThat(invokeIsKnownAbbreviation("MDU")).isTrue();
    }

    @Test
    @DisplayName("Should be case insensitive")
    void shouldBeCaseInsensitive() throws Exception {
      assertThat(invokeIsKnownAbbreviation("cmbt")).isTrue();
      assertThat(invokeIsKnownAbbreviation("Cmbt")).isTrue();
      assertThat(invokeIsKnownAbbreviation("CMBT")).isTrue();
    }

    @Test
    @DisplayName("Should return false for unknown abbreviations")
    void shouldReturnFalseForUnknown() throws Exception {
      assertThat(invokeIsKnownAbbreviation("XYZ")).isFalse();
      assertThat(invokeIsKnownAbbreviation("ABC")).isFalse();
      assertThat(invokeIsKnownAbbreviation("FAKE")).isFalse();
    }

    @Test
    @DisplayName("Should handle null and empty")
    void shouldHandleNullEmpty() throws Exception {
      assertThat(invokeIsKnownAbbreviation(null)).isFalse();
      assertThat(invokeIsKnownAbbreviation("")).isFalse();
    }
  }

  // ==================== HELPER METHODS ====================

  private void setField(Object target, String fieldName, Object value) throws Exception {
    Field field = target.getClass().getDeclaredField(fieldName);
    field.setAccessible(true);
    field.set(target, value);
  }

  private Map<String, Object> invokeParsePipeDelimitedResponse(String response) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "parsePipeDelimitedResponse", String.class);
    method.setAccessible(true);
    @SuppressWarnings("unchecked")
    Map<String, Object> result = (Map<String, Object>) method.invoke(geminiVisionService, response);
    return result;
  }

  private String invokeGuessMimeType(String imageUrl) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "guessMimeType", String.class);
    method.setAccessible(true);
    return (String) method.invoke(geminiVisionService, imageUrl);
  }

  private boolean invokeIsValidLocation(String location) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "isValidLocation", String.class);
    method.setAccessible(true);
    return (Boolean) method.invoke(geminiVisionService, location);
  }

  private boolean invokeIsOcrGarbage(String text) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "isOcrGarbage", String.class);
    method.setAccessible(true);
    return (Boolean) method.invoke(geminiVisionService, text);
  }

  private boolean invokeHasExcessiveRepetition(String text) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "hasExcessiveRepetition", String.class);
    method.setAccessible(true);
    return (Boolean) method.invoke(geminiVisionService, text);
  }

  private boolean invokeLooksRandom(String text) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "looksRandom", String.class);
    method.setAccessible(true);
    return (Boolean) method.invoke(geminiVisionService, text);
  }

  private boolean invokeIsKnownLocation(String name) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "isKnownLocation", String.class);
    method.setAccessible(true);
    return (Boolean) method.invoke(geminiVisionService, name);
  }

  private boolean invokeIsKnownAbbreviation(String text) throws Exception {
    java.lang.reflect.Method method = GeminiVisionServiceImpl.class.getDeclaredMethod(
        "isKnownAbbreviation", String.class);
    method.setAccessible(true);
    return (Boolean) method.invoke(geminiVisionService, text);
  }
}
