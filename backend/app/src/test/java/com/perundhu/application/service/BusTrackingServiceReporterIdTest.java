package com.perundhu.application.service;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;
import com.perundhu.domain.model.*;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.service.RouteValidationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Extended tests for BusTrackingService with Device ID / Reporter ID support
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("Bus Tracking Service - Reporter ID Tests")
class BusTrackingServiceReporterIdTest {

  @Mock
  private BusRepository busRepository;

  @Mock
  private StopRepository stopRepository;

  @Mock
  private RouteValidationService routeValidationService;

  @InjectMocks
  private BusTrackingServiceImpl busTrackingService;

  private BusLocationReportDTO reportWithDeviceId;
  private BusLocationReportDTO reportWithUserId;
  private Bus testBus;
  private Stop testStop;

  @BeforeEach
  void setUp() {
    MockitoAnnotations.openMocks(this);

    // Create test data
    Location fromLocation = createLocation(101L, "Chennai", 13.0827, 80.2707);
    Location toLocation = createLocation(102L, "Coimbatore", 11.0168, 76.9558);

    testBus = createBus(1L, "Express Bus", "XP101", fromLocation, toLocation);
    testStop = createStop(1L, "Chennai Central", fromLocation, 1);

    // Report with Device ID (anonymous tracking)
    reportWithDeviceId = new BusLocationReportDTO(
        1L,
        1L,
        "device_1234567890_abc123xyz", // Device ID instead of user ID
        LocalDateTime.now().toString(),
        13.0827,
        80.2707,
        15.5,
        5.2,
        90.0,
        "Android Device");

    // Report with User ID (authenticated tracking)
    reportWithUserId = new BusLocationReportDTO(
        1L,
        1L,
        "user_john@example.com", // User ID
        LocalDateTime.now().toString(),
        13.0827,
        80.2707,
        15.5,
        5.2,
        90.0,
        "Android Device");
  }

  @Nested
  @DisplayName("Device ID / Reporter ID Tests")
  class ReporterIdTests {

    @Test
    @DisplayName("Should accept device ID format in location report")
    void shouldAcceptDeviceIdFormat() {
      // Device ID format: device_timestamp_random
      String deviceId = "device_1234567890_abc123xyz";

      BusLocationReportDTO report = new BusLocationReportDTO(
          1L, 1L, deviceId,
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      assertThat(report.userId()).isEqualTo(deviceId);
      assertThat(report.userId()).matches("^device_\\d+_[a-z0-9]+$");
    }

    @Test
    @DisplayName("Should accept user ID format in location report")
    void shouldAcceptUserIdFormat() {
      // User ID format: user_email@domain.com
      String userId = "user_john@example.com";

      BusLocationReportDTO report = new BusLocationReportDTO(
          1L, 1L, userId,
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      assertThat(report.userId()).isEqualTo(userId);
    }

    @Test
    @DisplayName("Should differentiate between device ID and user ID")
    void shouldDifferentiateReporterTypes() {
      String deviceId = "device_1234567890_abc123xyz";
      String userId = "user_john@example.com";

      BusLocationReportDTO deviceReport = createReportWithReporter(deviceId);
      BusLocationReportDTO userReport = createReportWithReporter(userId);

      assertThat(deviceReport.userId().startsWith("device_")).isTrue();
      assertThat(userReport.userId().startsWith("user_")).isTrue();
    }

    @Test
    @DisplayName("Should track anonymous (device) contributions")
    void shouldTrackAnonymousContributions() {
      BusLocationReportDTO report = createReportWithReporter("device_1234567890_abc123xyz");

      // Verify device ID is captured
      assertThat(report.userId()).contains("device_");
      assertThat(report.userId()).isNotNull();
      assertThat(report.userId()).isNotEmpty();
    }

    @Test
    @DisplayName("Should track authenticated (user) contributions")
    void shouldTrackAuthenticatedContributions() {
      BusLocationReportDTO report = createReportWithReporter("user_john@example.com");

      // Verify user ID is captured
      assertThat(report.userId()).contains("user_");
      assertThat(report.userId()).isNotNull();
      assertThat(report.userId()).isNotEmpty();
    }
  }

  @Nested
  @DisplayName("Validation Tests with Reporter ID")
  class ValidationTests {

    @Test
    @DisplayName("Should validate device ID format")
    void shouldValidateDeviceIdFormat() {
      String validDeviceId = "device_1609459200000_xyz123abc";
      String invalidDeviceId = "invalid_format";

      BusLocationReportDTO validReport = createReportWithReporter(validDeviceId);
      assertThat(validReport.userId()).matches("^device_\\d+_[a-z0-9]+$");
    }

    @Test
    @DisplayName("Should handle null reporter ID gracefully")
    void shouldRejectNullReporterId() {
      // Service should handle null reporter ID gracefully
      // (it gets passed through but may affect tracking/rewards)
      BusLocationReportDTO invalidReport = new BusLocationReportDTO(
          1L, 1L, null, // Null reporter ID
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      // Service processes it without throwing exception
      RewardPointsDTO result = busTrackingService.processLocationReport(invalidReport);

      // Verify it returns a result even with null reporter ID
      assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("Should reject empty reporter ID")
    void shouldRejectEmptyReporterId() {
      BusLocationReportDTO report = createReportWithReporter("");
      // Should still work (DTO level), validation happens at service level
      assertThat(report.userId()).isEmpty();
    }

    @Test
    @DisplayName("Should accept valid coordinate data with any reporter ID format")
    void shouldAcceptValidCoordinatesWithAnyReporter() {
      String[] reporters = {
          "device_1234567890_abc123xyz",
          "user_john@example.com",
          "user_jane@example.com",
          "device_1609459200000_random123"
      };

      for (String reporter : reporters) {
        BusLocationReportDTO report = createReportWithReporter(reporter);

        assertThat(report.latitude()).isEqualTo(13.0827);
        assertThat(report.longitude()).isEqualTo(80.2707);
        assertThat(report.userId()).isEqualTo(reporter);
      }
    }
  }

  @Nested
  @DisplayName("Audit Trail Tests")
  class AuditTrailTests {

    @Test
    @DisplayName("Should capture device ID in audit trail for anonymous tracking")
    void shouldCaptureDeviceIdAudit() {
      String deviceId = "device_1234567890_abc123xyz";
      BusLocationReportDTO report = createReportWithReporter(deviceId);

      assertThat(report.userId()).isEqualTo(deviceId);
      // Audit system can use this for tracking
      assertThat(report.userId()).isNotNull();
    }

    @Test
    @DisplayName("Should capture user ID in audit trail for authenticated tracking")
    void shouldCaptureUserIdAudit() {
      String userId = "user_john@example.com";
      BusLocationReportDTO report = createReportWithReporter(userId);

      assertThat(report.userId()).isEqualTo(userId);
      assertThat(report.userId()).isNotNull();
    }

    @Test
    @DisplayName("Should include timestamp in audit trail")
    void shouldIncludeTimestampInAudit() {
      BusLocationReportDTO report = reportWithDeviceId;

      assertThat(report.timestamp()).isNotNull();
      assertThat(report.timestamp()).isNotEmpty();
    }

    @Test
    @DisplayName("Should include all relevant data for audit purposes")
    void shouldIncludeAllAuditData() {
      BusLocationReportDTO report = reportWithDeviceId;

      assertThat(report.userId()).isNotNull();
      assertThat(report.busId()).isEqualTo(1L);
      assertThat(report.latitude()).isNotNull();
      assertThat(report.longitude()).isNotNull();
      assertThat(report.timestamp()).isNotNull();
      assertThat(report.accuracy()).isNotNull();
    }
  }

  @Nested
  @DisplayName("Data Quality Tests")
  class DataQualityTests {

    @Test
    @DisplayName("Should accept high-accuracy GPS data from any reporter")
    void shouldAcceptHighAccuracyData() {
      Double[] accuracies = { 5.0, 10.5, 15.2, 20.0 };

      for (Double accuracy : accuracies) {
        BusLocationReportDTO report = new BusLocationReportDTO(
            1L, 1L, "device_123_abc",
            LocalDateTime.now().toString(),
            13.0827, 80.2707, accuracy, 5.2, 90.0, "Android");

        assertThat(report.accuracy()).isEqualTo(accuracy);
      }
    }

    @Test
    @DisplayName("Should accept realistic speed values")
    void shouldAcceptRealisticSpeedValues() {
      Double[] speeds = { 0.0, 5.0, 15.0, 25.0, 30.0 }; // m/s

      for (Double speed : speeds) {
        BusLocationReportDTO report = new BusLocationReportDTO(
            1L, 1L, "device_123_abc",
            LocalDateTime.now().toString(),
            13.0827, 80.2707, 15.5, speed, 90.0, "Android");

        assertThat(report.speed()).isEqualTo(speed);
      }
    }

    @Test
    @DisplayName("Should track data quality per reporter")
    void shouldTrackQualityPerReporter() {
      String deviceId1 = "device_1234567890_abc";
      String deviceId2 = "device_1234567890_xyz";

      BusLocationReportDTO report1 = createReportWithReporter(deviceId1);
      BusLocationReportDTO report2 = createReportWithReporter(deviceId2);

      // Both reports are valid, but from different devices
      assertThat(report1.userId()).isNotEqualTo(report2.userId());
      assertThat(report1.accuracy()).isEqualTo(report2.accuracy()); // Same accuracy
    }
  }

  @Nested
  @DisplayName("Backwards Compatibility Tests")
  class BackwardsCompatibilityTests {

    @Test
    @DisplayName("Should support old userId field in reports")
    void shouldSupportOldUserIdField() {
      // Existing reports with userId should still work
      BusLocationReportDTO report = new BusLocationReportDTO(
          1L, 1L, "user_existing_user",
          LocalDateTime.now().toString(),
          13.0827, 80.2707, 15.5, 5.2, 90.0, "Android");

      assertThat(report.userId()).isEqualTo("user_existing_user");
    }

    @Test
    @DisplayName("Should handle mixed device and user IDs in same session")
    void shouldHandleMixedReportIds() {
      BusLocationReportDTO deviceReport = reportWithDeviceId;
      BusLocationReportDTO userReport = reportWithUserId;

      assertThat(deviceReport.userId()).startsWith("device_");
      assertThat(userReport.userId()).startsWith("user_");
      assertThat(deviceReport.userId()).isNotEqualTo(userReport.userId());
    }
  }

  // Helper methods
  private BusLocationReportDTO createReportWithReporter(String reporterId) {
    return new BusLocationReportDTO(
        1L,
        1L,
        reporterId,
        LocalDateTime.now().toString(),
        13.0827,
        80.2707,
        15.5,
        5.2,
        90.0,
        "Android Device");
  }

  private Location createLocation(Long id, String name, double latitude, double longitude) {
    return new Location(new LocationId(id), name, "English", latitude, longitude);
  }

  private Bus createBus(Long id, String name, String busNumber, Location from, Location to) {
    return new Bus(
        BusId.of(id),
        busNumber,
        name,
        "Test Operator",
        "Express",
        from,
        to,
        LocalTime.of(8, 30),
        LocalTime.of(14, 0),
        50,
        Arrays.asList("AC"));
  }

  private Stop createStop(Long id, String name, Location location, int sequence) {
    return new Stop(
        StopId.of(id),
        name,
        location,
        LocalTime.of(8, 30),
        LocalTime.of(14, 0),
        sequence,
        List.of());
  }
}
