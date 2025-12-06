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

  // Helper methods

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
}
