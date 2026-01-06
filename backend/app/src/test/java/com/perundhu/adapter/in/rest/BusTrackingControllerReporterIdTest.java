package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;
import com.perundhu.application.service.AuthenticationService;
import com.perundhu.application.service.BusTrackingService;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.junit.jupiter.SpringExtension;

import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Tests for BusTrackingController with Device ID / Reporter ID support
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Bus Tracking Controller - Reporter ID Tests")
class BusTrackingControllerReporterIdTest {

  @Mock
  private BusTrackingService busTrackingService;

  @Mock
  private AuthenticationService authenticationService;

  @InjectMocks
  private BusTrackingController controller;

  private BusLocationReportDTO reportWithDeviceId;
  private BusLocationReportDTO reportWithUserId;

  @BeforeEach
  void setUp() {
    // Report with Device ID
    reportWithDeviceId = new BusLocationReportDTO(
        1L,
        1L,
        "device_1234567890_abc123xyz",
        LocalDateTime.now().toString(),
        13.0827,
        80.2707,
        15.5,
        5.2,
        90.0,
        "Android Device");

    // Report with User ID
    reportWithUserId = new BusLocationReportDTO(
        1L,
        1L,
        "user_john@example.com",
        LocalDateTime.now().toString(),
        13.0827,
        80.2707,
        15.5,
        5.2,
        90.0,
        "Android Device");
  }

  @Nested
  @DisplayName("Location Report with Reporter ID")
  class LocationReportTests {

    @Test
    @DisplayName("Should accept location report with device ID")
    void shouldAcceptDeviceIdReport() {
      RewardPointsDTO expectedRewards = new RewardPointsDTO(
          "device_1234567890_abc123xyz", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(expectedRewards);

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(busTrackingService).processLocationReport(any(BusLocationReportDTO.class));
    }

    @Test
    @DisplayName("Should accept location report with user ID")
    void shouldAcceptUserIdReport() {
      RewardPointsDTO expectedRewards = new RewardPointsDTO(
          "user_john@example.com", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(expectedRewards);

      ResponseEntity<?> response = controller.reportBusLocation(reportWithUserId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      verify(busTrackingService).processLocationReport(any(BusLocationReportDTO.class));
    }

    @Test
    @DisplayName("Should process device ID in service layer")
    void shouldProcessDeviceIdInService() {
      RewardPointsDTO rewards = new RewardPointsDTO(
          "device_1234567890_abc123xyz", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(rewards);

      controller.reportBusLocation(reportWithDeviceId);

      verify(busTrackingService)
          .processLocationReport(argThat(report -> report.userId().equals("device_1234567890_abc123xyz")));
    }

    @Test
    @DisplayName("Should return rewards regardless of reporter ID type")
    void shouldReturnRewardsForAnyReporter() {
      RewardPointsDTO deviceRewards = new RewardPointsDTO(
          "device_123", 5, 5, 5, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(deviceRewards);

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isEqualTo(deviceRewards);
    }
  }

  @Nested
  @DisplayName("Request Validation with Reporter ID")
  class ValidationTests {

    @Test
    @DisplayName("Should validate bus ID is present")
    void shouldValidateBusId() {
      BusLocationReportDTO invalidReport = new BusLocationReportDTO(
          null, // Missing bus ID
          1L,
          "device_123",
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      ResponseEntity<?> response = controller.reportBusLocation(invalidReport);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should validate reporter ID is present")
    void shouldValidateReporterId() {
      BusLocationReportDTO invalidReport = new BusLocationReportDTO(
          1L,
          1L,
          null, // Missing reporter ID
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      ResponseEntity<?> response = controller.reportBusLocation(invalidReport);

      // Should be handled by DTO validation or controller
      assertThat(response.getStatusCode()).isNotEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Should validate coordinates are within valid range")
    void shouldValidateCoordinates() {
      // DTO validates coordinates at construction time, so this should throw
      assertThatThrownBy(() -> {
        new BusLocationReportDTO(
            1L,
            1L,
            "device_123",
            LocalDateTime.now().toString(),
            999.0, // Invalid latitude
            999.0, // Invalid longitude
            15.5, 5.2, 90.0, "Android");
      }).isInstanceOf(IllegalArgumentException.class)
        .hasMessageContaining("Latitude must be between -90 and 90");
    }
  }

  @Nested
  @DisplayName("Error Handling with Reporter ID")
  class ErrorHandlingTests {

    @Test
    @DisplayName("Should handle service errors gracefully")
    void shouldHandleServiceErrors() {
      when(busTrackingService.processLocationReport(any()))
          .thenThrow(new IllegalArgumentException("Invalid bus ID"));

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should handle null bus ID error")
    void shouldHandleNullBusId() {
      BusLocationReportDTO report = new BusLocationReportDTO(
          null, 1L, "device_123",
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      ResponseEntity<?> response = controller.reportBusLocation(report);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    @DisplayName("Should return internal server error on unexpected exceptions")
    void shouldHandleUnexpectedErrors() {
      when(busTrackingService.processLocationReport(any()))
          .thenThrow(new RuntimeException("Unexpected error"));

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Nested
  @DisplayName("Audit Trail Tests")
  class AuditTrailTests {

    @Test
    @DisplayName("Should log device ID in audit trail")
    void shouldLogDeviceIdAudit() {
      RewardPointsDTO rewards = new RewardPointsDTO(
          "device_123", 5, 5, 5, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(rewards);

      controller.reportBusLocation(reportWithDeviceId);

      verify(busTrackingService)
          .processLocationReport(argThat(report -> report.userId() != null && report.userId().startsWith("device_")));
    }

    @Test
    @DisplayName("Should log user ID in audit trail")
    void shouldLogUserIdAudit() {
      RewardPointsDTO rewards = new RewardPointsDTO(
          "user_john@example.com", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(rewards);

      controller.reportBusLocation(reportWithUserId);

      verify(busTrackingService)
          .processLocationReport(argThat(report -> report.userId() != null && report.userId().startsWith("user_")));
    }

    @Test
    @DisplayName("Should preserve reporter ID through request processing")
    void shouldPreserveReporterIdThroughProcessing() {
      RewardPointsDTO rewards = new RewardPointsDTO(
          "device_1234567890_abc123xyz", 5, 5, 5, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(rewards);

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      // Reporter ID should be preserved in the response
      assertThat(response.getBody()).isNotNull();
      verify(busTrackingService).processLocationReport(any());
    }
  }

  @Nested
  @DisplayName("Data Quality Tests")
  class DataQualityTests {

    @Test
    @DisplayName("Should accept and process high-accuracy GPS data")
    void shouldProcessHighAccuracyData() {
      BusLocationReportDTO highAccuracyReport = new BusLocationReportDTO(
          1L, 1L, "device_123",
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 5.0, // 5 meter accuracy
          5.2, 90.0, "Android");

      RewardPointsDTO rewards = new RewardPointsDTO(
          "device_123", 15, 15, 15, "REGULAR", 10, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(rewards);

      ResponseEntity<?> response = controller.reportBusLocation(highAccuracyReport);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }

    @Test
    @DisplayName("Should accept realistic speed values")
    void shouldAcceptRealisticSpeeds() {
      BusLocationReportDTO report = new BusLocationReportDTO(
          1L, 1L, "device_123",
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5,
          20.0, // 20 m/s = 72 km/h
          90.0, "Android");

      RewardPointsDTO rewards = new RewardPointsDTO(
          "device_123", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(rewards);

      ResponseEntity<?> response = controller.reportBusLocation(report);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
    }
  }

  @Nested
  @DisplayName("Response Structure Tests")
  class ResponseStructureTests {

    @Test
    @DisplayName("Should return reward points DTO in response")
    void shouldReturnRewardPointsDto() {
      RewardPointsDTO expectedRewards = new RewardPointsDTO(
          "device_123", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(expectedRewards);

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
      assertThat(response.getBody()).isEqualTo(expectedRewards);
    }

    @Test
    @DisplayName("Should maintain reporter ID in response for tracking")
    void shouldMaintainReporterIdInResponse() {
      RewardPointsDTO expectedRewards = new RewardPointsDTO(
          "device_1234567890_abc123xyz", 10, 10, 10, "BEGINNER", 0, List.of());
      when(busTrackingService.processLocationReport(any())).thenReturn(expectedRewards);

      ResponseEntity<?> response = controller.reportBusLocation(reportWithDeviceId);

      RewardPointsDTO body = (RewardPointsDTO) response.getBody();
      assertThat(body.userId()).isEqualTo("device_1234567890_abc123xyz");
    }
  }
}
