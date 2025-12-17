package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.domain.port.GeminiVisionService;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.RouteContributionOutputPort;

/**
 * Unit tests for ImageContributionProcessingService.
 * 
 * Tests cover:
 * - Image contribution processing
 * - OCR data extraction
 * - Route creation from OCR data
 * - Processing statistics
 * - Error handling
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Image Contribution Processing Service Tests")
class ImageContributionProcessingServiceTest {

  @Mock
  private FileStorageService fileStorageService;

  @Mock
  private ImageContributionOutputPort imageContributionOutputPort;

  @Mock
  private RouteContributionOutputPort routeContributionOutputPort;

  @Mock
  private LocationResolutionService locationResolutionService;

  @Mock
  private GeminiVisionService geminiVisionService;

  @Mock
  private ContributionProcessingService contributionProcessingService;

  private ImageContributionProcessingService imageContributionProcessingService;

  @BeforeEach
  void setUp() {
    imageContributionProcessingService = new ImageContributionProcessingService(
        fileStorageService,
        imageContributionOutputPort,
        routeContributionOutputPort,
        locationResolutionService,
        geminiVisionService,
        contributionProcessingService);
  }

  @Nested
  @DisplayName("OCR Data Extraction Tests")
  class OcrDataExtractionTests {

    @Test
    @DisplayName("Should extract OCR data using Gemini Vision")
    void shouldExtractOcrDataUsingGeminiVision() {
      // Given
      ImageContribution contribution = createTestContribution();
      byte[] imageBytes = "test image content".getBytes();
      contribution.setImageData(imageBytes);
      contribution.setImageContentType("image/jpeg");

      Map<String, Object> geminiResult = new HashMap<>();
      geminiResult.put("origin", "SIVAKASI");
      geminiResult.put("confidence", 0.85);
      geminiResult.put("routes", List.of(
          Map.of(
              "fromLocation", "SIVAKASI",
              "toLocation", "MADURAI",
              "departureTimes", List.of("06:00", "08:00"))));

      when(geminiVisionService.isAvailable()).thenReturn(true);
      when(geminiVisionService.extractBusScheduleFromBase64(anyString(), anyString()))
          .thenReturn(geminiResult);

      // When
      Map<String, Object> result = imageContributionProcessingService.extractOCRData(contribution);

      // Then
      assertThat(result).isNotNull();
      assertThat(result.get("origin")).isEqualTo("SIVAKASI");
      assertThat(result.get("confidence")).isEqualTo(0.85);
      assertThat(result.get("extractionMethod")).isEqualTo("gemini-vision");
    }

    @Test
    @DisplayName("Should return manual entry required when Gemini not available")
    void shouldReturnManualEntryWhenGeminiNotAvailable() {
      // Given
      ImageContribution contribution = createTestContribution();
      when(geminiVisionService.isAvailable()).thenReturn(false);

      // When
      Map<String, Object> result = imageContributionProcessingService.extractOCRData(contribution);

      // Then
      assertThat(result).isNotNull();
      assertThat(result.get("requiresManualEntry")).isEqualTo(true);
      assertThat(result.get("extractionMethod")).isEqualTo("manual-required");
    }

    @Test
    @DisplayName("Should handle Gemini extraction error")
    void shouldHandleGeminiExtractionError() {
      // Given
      ImageContribution contribution = createTestContribution();
      byte[] imageBytes = "test image content".getBytes();
      contribution.setImageData(imageBytes);
      contribution.setImageContentType("image/jpeg");

      Map<String, Object> errorResult = new HashMap<>();
      errorResult.put("error", "API rate limit exceeded");

      when(geminiVisionService.isAvailable()).thenReturn(true);
      when(geminiVisionService.extractBusScheduleFromBase64(anyString(), anyString()))
          .thenReturn(errorResult);

      // When
      Map<String, Object> result = imageContributionProcessingService.extractOCRData(contribution);

      // Then
      assertThat(result).isNotNull();
      assertThat(result.get("requiresManualEntry")).isEqualTo(true);
    }
  }

  @Nested
  @DisplayName("Route Creation from OCR Data Tests")
  class RouteCreationTests {

    @Test
    @DisplayName("Should create route contributions from OCR data")
    void shouldCreateRouteContributionsFromOcrData() {
      // Given
      ImageContribution contribution = createTestContribution();

      Map<String, Object> extractedData = new HashMap<>();
      extractedData.put("routeNumber", "166");
      extractedData.put("fromLocation", "MADURAI");
      extractedData.put("toLocation", "CHENNAI");
      extractedData.put("timing", List.of("06:00", "14:30"));

      // Mock location resolution using factory methods
      LocationResolutionService.LocationResolution maduraiResolution = LocationResolutionService.LocationResolution
          .exact("MADURAI", "MADURAI");
      LocationResolutionService.LocationResolution chennaiResolution = LocationResolutionService.LocationResolution
          .exact("CHENNAI", "CHENNAI");

      when(locationResolutionService.resolve("MADURAI")).thenReturn(maduraiResolution);
      when(locationResolutionService.resolve("CHENNAI")).thenReturn(chennaiResolution);
      when(routeContributionOutputPort.save(any(RouteContribution.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      List<RouteContribution> routes = imageContributionProcessingService
          .createRouteDataFromOCR(contribution, extractedData);

      // Then
      assertThat(routes).isNotEmpty();
      verify(routeContributionOutputPort).save(any(RouteContribution.class));
    }

    @Test
    @DisplayName("Should create routes with auto-approval when specified")
    void shouldCreateRoutesWithAutoApproval() {
      // Given
      ImageContribution contribution = createTestContribution();

      Map<String, Object> extractedData = new HashMap<>();
      extractedData.put("routeNumber", "520");
      extractedData.put("fromLocation", "COIMBATORE");
      extractedData.put("toLocation", "BENGALURU");
      extractedData.put("timing", List.of("08:00"));

      LocationResolutionService.LocationResolution coimbatoreResolution = LocationResolutionService.LocationResolution
          .exact("COIMBATORE", "COIMBATORE");
      LocationResolutionService.LocationResolution bengaluruResolution = LocationResolutionService.LocationResolution
          .exact("BENGALURU", "BENGALURU");

      when(locationResolutionService.resolve("COIMBATORE")).thenReturn(coimbatoreResolution);
      when(locationResolutionService.resolve("BENGALURU")).thenReturn(bengaluruResolution);
      when(routeContributionOutputPort.save(any(RouteContribution.class)))
          .thenAnswer(invocation -> {
            RouteContribution saved = invocation.getArgument(0);
            assertThat(saved.getStatus()).isEqualTo("APPROVED");
            return saved;
          });

      // When
      List<RouteContribution> routes = imageContributionProcessingService
          .createRouteDataFromOCR(contribution, extractedData, true);

      // Then
      assertThat(routes).isNotEmpty();
    }

    @Test
    @DisplayName("Should skip routes with short/invalid locations")
    void shouldSkipRoutesWithShortOrInvalidLocations() {
      // Given - using short location names (<4 chars) which are rejected
      ImageContribution contribution = createTestContribution();

      Map<String, Object> extractedData = new HashMap<>();
      extractedData.put("routeNumber", "123");
      extractedData.put("fromLocation", "AB"); // Too short (< 4 chars)
      extractedData.put("toLocation", "XY"); // Too short (< 4 chars)

      // When
      List<RouteContribution> routes = imageContributionProcessingService
          .createRouteDataFromOCR(contribution, extractedData);

      // Then - short locations are rejected, so no routes created
      assertThat(routes).isEmpty();
      verify(routeContributionOutputPort, never()).save(any());
    }

    @Test
    @DisplayName("Should skip routes where origin equals destination")
    void shouldSkipRoutesWhereOriginEqualsDestination() {
      // Given
      ImageContribution contribution = createTestContribution();

      Map<String, Object> extractedData = new HashMap<>();
      extractedData.put("routeNumber", "LOCAL");
      extractedData.put("fromLocation", "MADURAI");
      extractedData.put("toLocation", "MADURAI");

      LocationResolutionService.LocationResolution maduraiResolution = LocationResolutionService.LocationResolution
          .exact("MADURAI", "MADURAI");

      when(locationResolutionService.resolve("MADURAI")).thenReturn(maduraiResolution);

      // When
      List<RouteContribution> routes = imageContributionProcessingService
          .createRouteDataFromOCR(contribution, extractedData);

      // Then
      assertThat(routes).isEmpty();
      verify(routeContributionOutputPort, never()).save(any());
    }

    @Test
    @DisplayName("Should expand routes with multiple departure times")
    void shouldExpandRoutesWithMultipleDepartureTimes() {
      // Given
      ImageContribution contribution = createTestContribution();

      List<Map<String, Object>> routesArray = new ArrayList<>();
      Map<String, Object> route = new HashMap<>();
      route.put("fromLocation", "SIVAKASI");
      route.put("toLocation", "MADURAI");
      route.put("departureTimes", List.of("06:00", "08:00", "10:00", "12:00"));
      routesArray.add(route);

      Map<String, Object> extractedData = new HashMap<>();
      extractedData.put("routes", routesArray);

      LocationResolutionService.LocationResolution sivakasiResolution = LocationResolutionService.LocationResolution
          .exact("SIVAKASI", "SIVAKASI");
      LocationResolutionService.LocationResolution maduraiResolution = LocationResolutionService.LocationResolution
          .exact("MADURAI", "MADURAI");

      when(locationResolutionService.resolve("SIVAKASI")).thenReturn(sivakasiResolution);
      when(locationResolutionService.resolve("MADURAI")).thenReturn(maduraiResolution);
      when(routeContributionOutputPort.save(any(RouteContribution.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      List<RouteContribution> routes = imageContributionProcessingService
          .createRouteDataFromOCR(contribution, extractedData);

      // Then - should create 4 routes (one per departure time)
      assertThat(routes).hasSize(4);
    }
  }

  @Nested
  @DisplayName("Processing Statistics Tests")
  class ProcessingStatisticsTests {

    @Test
    @DisplayName("Should return processing statistics")
    void shouldReturnProcessingStatistics() {
      // Given
      when(imageContributionOutputPort.count()).thenReturn(100L);
      when(imageContributionOutputPort.countByStatus("PROCESSING")).thenReturn(5L);
      when(imageContributionOutputPort.countByStatus("PROCESSED")).thenReturn(80L);
      when(imageContributionOutputPort.countByStatus("PROCESSING_FAILED")).thenReturn(3L);
      when(imageContributionOutputPort.countByStatus("MANUAL_REVIEW_NEEDED")).thenReturn(10L);
      when(imageContributionOutputPort.countByStatus("LOW_CONFIDENCE_OCR")).thenReturn(2L);

      // When
      Map<String, Object> stats = imageContributionProcessingService.getProcessingStatistics();

      // Then
      assertThat(stats.get("totalImages")).isEqualTo(100L);
      assertThat(stats.get("processing")).isEqualTo(5L);
      assertThat(stats.get("processed")).isEqualTo(80L);
      assertThat(stats.get("failed")).isEqualTo(3L);
      assertThat(stats.get("needsReview")).isEqualTo(10L);
      assertThat(stats.get("lowConfidence")).isEqualTo(2L);
      assertThat((Double) stats.get("successRate")).isEqualTo(80.0);
    }

    @Test
    @DisplayName("Should handle zero total images")
    void shouldHandleZeroTotalImages() {
      // Given
      when(imageContributionOutputPort.count()).thenReturn(0L);
      when(imageContributionOutputPort.countByStatus(anyString())).thenReturn(0L);

      // When
      Map<String, Object> stats = imageContributionProcessingService.getProcessingStatistics();

      // Then
      assertThat(stats.get("totalImages")).isEqualTo(0L);
      assertThat((Double) stats.get("successRate")).isEqualTo(0.0);
    }
  }

  @Nested
  @DisplayName("Retry Processing Tests")
  class RetryProcessingTests {

    @Test
    @DisplayName("Should retry processing for failed contributions")
    void shouldRetryProcessingForFailedContributions() {
      // Given
      ImageContribution contribution = createTestContribution();
      contribution.setStatus("PROCESSING_FAILED");

      when(imageContributionOutputPort.findById("test-id")).thenReturn(Optional.of(contribution));
      when(imageContributionOutputPort.save(any())).thenReturn(contribution);

      // When
      boolean result = imageContributionProcessingService.retryImageProcessing("test-id");

      // Then
      assertThat(result).isTrue();
      verify(imageContributionOutputPort, atLeastOnce()).save(any());
    }

    @Test
    @DisplayName("Should retry processing for low confidence contributions")
    void shouldRetryProcessingForLowConfidenceContributions() {
      // Given
      ImageContribution contribution = createTestContribution();
      contribution.setStatus("LOW_CONFIDENCE_OCR");

      when(imageContributionOutputPort.findById("test-id")).thenReturn(Optional.of(contribution));
      when(imageContributionOutputPort.save(any())).thenReturn(contribution);

      // When
      boolean result = imageContributionProcessingService.retryImageProcessing("test-id");

      // Then
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should not retry processing for already processed contributions")
    void shouldNotRetryForProcessedContributions() {
      // Given
      ImageContribution contribution = createTestContribution();
      contribution.setStatus("PROCESSED");

      when(imageContributionOutputPort.findById("test-id")).thenReturn(Optional.of(contribution));

      // When
      boolean result = imageContributionProcessingService.retryImageProcessing("test-id");

      // Then
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return false for non-existent contribution")
    void shouldReturnFalseForNonExistentContribution() {
      // Given
      when(imageContributionOutputPort.findById("non-existent")).thenReturn(Optional.empty());

      // When
      boolean result = imageContributionProcessingService.retryImageProcessing("non-existent");

      // Then
      assertThat(result).isFalse();
    }
  }

  @Nested
  @DisplayName("Image Contribution Processing Tests")
  class ImageContributionProcessingTests {

    @Test
    @DisplayName("Should process image contribution successfully")
    void shouldProcessImageContributionSuccessfully() throws Exception {
      // Given
      MockMultipartFile imageFile = new MockMultipartFile(
          "image",
          "bus-schedule.jpg",
          "image/jpeg",
          "fake image content".getBytes());

      Map<String, String> metadata = new HashMap<>();
      metadata.put("description", "Bus timing board");
      metadata.put("location", "Sivakasi Bus Stand");

      when(fileStorageService.storeImageFile(any(), anyString()))
          .thenReturn("https://storage.example.com/images/bus-schedule.jpg");
      when(imageContributionOutputPort.save(any(ImageContribution.class)))
          .thenAnswer(invocation -> {
            ImageContribution saved = invocation.getArgument(0);
            return saved;
          });

      // When
      ImageContribution result = imageContributionProcessingService
          .processImageContribution(imageFile, metadata, "user-123");

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getUserId()).isEqualTo("user-123");
      assertThat(result.getDescription()).isEqualTo("Bus timing board");
    }

    @Test
    @DisplayName("Should create failed contribution on storage error")
    void shouldCreateFailedContributionOnStorageError() throws Exception {
      // Given
      MockMultipartFile imageFile = new MockMultipartFile(
          "image",
          "bus-schedule.jpg",
          "image/jpeg",
          "fake image content".getBytes());

      Map<String, String> metadata = new HashMap<>();

      when(fileStorageService.storeImageFile(any(), anyString()))
          .thenThrow(new RuntimeException("Storage unavailable"));
      when(imageContributionOutputPort.save(any(ImageContribution.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      ImageContribution result = imageContributionProcessingService
          .processImageContribution(imageFile, metadata, "user-123");

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getStatus()).isEqualTo("UPLOAD_FAILED");
    }
  }

  // Helper method to create test contribution
  private ImageContribution createTestContribution() {
    return ImageContribution.builder()
        .id("test-id")
        .userId("user-123")
        .imageUrl("https://storage.example.com/images/test.jpg")
        .description("Test bus schedule")
        .location("Test Location")
        .status("PROCESSING")
        .submissionDate(LocalDateTime.now())
        .build();
  }
}
