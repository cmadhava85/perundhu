package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.SecurityMonitoringPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("Contribution Application Service Tests")
class ContributionApplicationServiceTest {

  @Mock
  private RouteContributionOutputPort routeContributionOutputPort;

  @Mock
  private ImageContributionOutputPort imageContributionOutputPort;

  @Mock
  private InputValidationPort inputValidationPort;

  @Mock
  private SecurityMonitoringPort securityMonitoringPort;

  private ContributionApplicationService contributionApplicationService;

  @BeforeEach
  void setUp() {
    contributionApplicationService = new ContributionApplicationService(
        routeContributionOutputPort,
        imageContributionOutputPort,
        inputValidationPort,
        securityMonitoringPort);
  }

  @Nested
  @DisplayName("Submit Route Contribution Tests")
  class SubmitRouteContributionTests {

    @Test
    @DisplayName("Should submit valid route contribution")
    void shouldSubmitValidRouteContribution() {
      // Given
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("busNumber", "BUS001");
      contributionData.put("busName", "Express");
      contributionData.put("fromLocationName", "Chennai");
      contributionData.put("toLocationName", "Bangalore");

      InputValidationPort.ContributionValidationResult validationResult = 
          new InputValidationPort.ContributionValidationResult(true, new HashMap<>(), contributionData);

      when(inputValidationPort.validateContributionData(any()))
          .thenReturn(validationResult);

      RouteContribution savedContribution = RouteContribution.builder()
          .id(UUID.randomUUID().toString())
          .busNumber("BUS001")
          .status("PENDING")
          .userId("user123")
          .submissionDate(LocalDateTime.now())
          .build();

      when(routeContributionOutputPort.save(any(RouteContribution.class)))
          .thenReturn(savedContribution);

      // When
      RouteContribution result = contributionApplicationService
          .submitRouteContribution(contributionData, "user123");

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getBusNumber()).isEqualTo("BUS001");
      assertThat(result.getStatus()).isEqualTo("PENDING");
      verify(inputValidationPort).validateContributionData(any());
      verify(routeContributionOutputPort).save(any(RouteContribution.class));
    }

    @Test
    @DisplayName("Should reject invalid route contribution")
    void shouldRejectInvalidRouteContribution() {
      // Given
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("busNumber", "");
      
      Map<String, String> errors = new HashMap<>();
      errors.put("busNumber", "Bus number is required");
      
      InputValidationPort.ContributionValidationResult validationResult = 
          new InputValidationPort.ContributionValidationResult(false, errors, new HashMap<>());

      when(inputValidationPort.validateContributionData(any()))
          .thenReturn(validationResult);

      // When & Then
      assertThatThrownBy(() -> 
          contributionApplicationService.submitRouteContribution(contributionData, "user123"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Invalid contribution data");
    }
  }

  @Nested
  @DisplayName("Submit Image Contribution Tests")
  class SubmitImageContributionTests {

    @Test
    @DisplayName("Should submit valid image contribution")
    void shouldSubmitValidImageContribution() {
      // Given
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("description", "Test image");
      contributionData.put("location", "Chennai");
      contributionData.put("imageUrl", "http://example.com/image.jpg");

      InputValidationPort.ContributionValidationResult validationResult = 
          new InputValidationPort.ContributionValidationResult(true, new HashMap<>(), contributionData);

      when(inputValidationPort.validateContributionData(any()))
          .thenReturn(validationResult);

      ImageContribution savedContribution = ImageContribution.builder()
          .id(UUID.randomUUID().toString())
          .description("Test image")
          .status("PENDING")
          .userId("user123")
          .submissionDate(LocalDateTime.now())
          .build();

      when(imageContributionOutputPort.save(any(ImageContribution.class)))
          .thenReturn(savedContribution);

      // When
      ImageContribution result = contributionApplicationService
          .submitImageContribution(contributionData, "user123");

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getDescription()).isEqualTo("Test image");
      assertThat(result.getStatus()).isEqualTo("PENDING");
      verify(imageContributionOutputPort).save(any(ImageContribution.class));
    }
  }

  @Nested
  @DisplayName("Get User Contributions Tests")
  class GetUserContributionsTests {

    @Test
    @DisplayName("Should return user contributions")
    void shouldReturnUserContributions() {
      // Given
      String userId = "user123";
      
      List<RouteContribution> routeContributions = List.of(
          RouteContribution.builder()
              .id("1")
              .busNumber("BUS001")
              .status("APPROVED")
              .userId(userId)
              .submissionDate(LocalDateTime.now())
              .build()
      );

      List<ImageContribution> imageContributions = List.of(
          ImageContribution.builder()
              .id("2")
              .description("Test image")
              .status("PENDING")
              .userId(userId)
              .submissionDate(LocalDateTime.now())
              .build()
      );

      when(routeContributionOutputPort.findByUserId(userId))
          .thenReturn(routeContributions);
      when(imageContributionOutputPort.findByUserId(userId))
          .thenReturn(imageContributions);

      // When
      List<Map<String, Object>> result = contributionApplicationService
          .getUserContributions(userId);

      // Then
      assertThat(result).hasSize(2);
      verify(routeContributionOutputPort).findByUserId(userId);
      verify(imageContributionOutputPort).findByUserId(userId);
    }

    @Test
    @DisplayName("Should return empty list when user has no contributions")
    void shouldReturnEmptyListWhenUserHasNoContributions() {
      // Given
      String userId = "nonexistent";

      when(routeContributionOutputPort.findByUserId(userId))
          .thenReturn(new ArrayList<>());
      when(imageContributionOutputPort.findByUserId(userId))
          .thenReturn(new ArrayList<>());

      // When
      List<Map<String, Object>> result = contributionApplicationService
          .getUserContributions(userId);

      // Then
      assertThat(result).isEmpty();
    }
  }

  @Nested
  @DisplayName("Update Contribution Status Tests")
  class UpdateContributionStatusTests {

    @Test
    @DisplayName("Should approve route contribution")
    void shouldApproveRouteContribution() {
      // Given
      String contributionId = "1";
      RouteContribution contribution = RouteContribution.builder()
          .id(contributionId)
          .status("PENDING")
          .busNumber("BUS001")
          .build();

      when(routeContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(routeContributionOutputPort.save(any(RouteContribution.class)))
          .thenReturn(contribution);

      // When
      contributionApplicationService.approveRouteContribution(contributionId, "admin123");

      // Then
      verify(routeContributionOutputPort).findById(contributionId);
      verify(routeContributionOutputPort).save(any(RouteContribution.class));
    }

    @Test
    @DisplayName("Should reject route contribution with reason")
    void shouldRejectRouteContributionWithReason() {
      // Given
      String contributionId = "1";
      RouteContribution contribution = RouteContribution.builder()
          .id(contributionId)
          .status("PENDING")
          .busNumber("BUS001")
          .build();

      when(routeContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(routeContributionOutputPort.save(any(RouteContribution.class)))
          .thenReturn(contribution);

      // When
      contributionApplicationService.rejectRouteContribution(
          contributionId, "Incomplete information", "admin123");

      // Then
      verify(routeContributionOutputPort).findById(contributionId);
      verify(routeContributionOutputPort).save(any(RouteContribution.class));
    }

    @Test
    @DisplayName("Should throw exception when contribution not found")
    void shouldThrowExceptionWhenContributionNotFound() {
      // Given
      String contributionId = "nonexistent";

      when(routeContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.empty());
      when(imageContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.empty());

      // When & Then
      assertThatThrownBy(() -> 
          contributionApplicationService.updateContributionStatus(
              contributionId, "APPROVED", "Approved"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Contribution not found");
    }
  }

  @Nested
  @DisplayName("Get Pending Contributions Tests")
  class GetPendingContributionsTests {

    @Test
    @DisplayName("Should get pending route contributions")
    void shouldGetPendingRouteContributions() {
      // Given
      List<RouteContribution> pendingRoutes = List.of(
          RouteContribution.builder()
              .id("1")
              .status("PENDING")
              .busNumber("BUS001")
              .build()
      );

      when(routeContributionOutputPort.findByStatus("PENDING"))
          .thenReturn(pendingRoutes);

      // When
      List<RouteContribution> result = contributionApplicationService
          .getPendingRouteContributions();

      // Then
      assertThat(result).hasSize(1);
      assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
      verify(routeContributionOutputPort).findByStatus("PENDING");
    }

    @Test
    @DisplayName("Should get pending image contributions")
    void shouldGetPendingImageContributions() {
      // Given
      List<ImageContribution> pendingImages = List.of(
          ImageContribution.builder()
              .id("1")
              .status("PENDING")
              .description("Test image")
              .build()
      );

      when(imageContributionOutputPort.findByStatus("PENDING"))
          .thenReturn(pendingImages);

      // When
      List<ImageContribution> result = contributionApplicationService
          .getPendingImageContributions();

      // Then
      assertThat(result).hasSize(1);
      assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
    }
  }

  @Nested
  @DisplayName("Get All Contributions Tests")
  class GetAllContributionsTests {

    @Test
    @DisplayName("Should return all contributions")
    void shouldReturnAllContributions() {
      // Given
      List<RouteContribution> allRoutes = List.of(
          RouteContribution.builder()
              .id("1")
              .busNumber("BUS001")
              .userId("user123")
              .submissionDate(LocalDateTime.now())
              .build()
      );

      List<ImageContribution> allImages = List.of(
          ImageContribution.builder()
              .id("2")
              .description("Image")
              .userId("user456")
              .submissionDate(LocalDateTime.now())
              .build()
      );

      when(routeContributionOutputPort.findAll())
          .thenReturn(allRoutes);
      when(imageContributionOutputPort.findAll())
          .thenReturn(allImages);

      // When
      List<Map<String, Object>> result = contributionApplicationService.getAllContributions();

      // Then
      assertThat(result).hasSize(2);
      verify(routeContributionOutputPort).findAll();
      verify(imageContributionOutputPort).findAll();
    }
  }

  @Nested
  @DisplayName("Get Contribution Statistics Tests")
  class GetContributionStatisticsTests {

    @Test
    @DisplayName("Should return contribution statistics")
    void shouldReturnContributionStatistics() {
      // Given
      when(routeContributionOutputPort.count()).thenReturn(10L);
      when(routeContributionOutputPort.countByStatus("PENDING")).thenReturn(3L);
      when(routeContributionOutputPort.countByStatus("APPROVED")).thenReturn(5L);
      when(routeContributionOutputPort.countByStatus("REJECTED")).thenReturn(2L);
      when(imageContributionOutputPort.count()).thenReturn(20L);
      when(imageContributionOutputPort.countByStatus("PENDING")).thenReturn(8L);
      when(imageContributionOutputPort.countByStatus("APPROVED")).thenReturn(10L);
      when(imageContributionOutputPort.countByStatus("REJECTED")).thenReturn(2L);

      // When
      Map<String, Object> stats = contributionApplicationService.getContributionStatistics();

      // Then
      assertThat(stats).containsKeys(
          "totalContributions",
          "totalRouteContributions",
          "totalImageContributions",
          "pendingContributions",
          "approvedContributions",
          "rejectedContributions"
      );
      assertThat(stats.get("totalContributions")).isEqualTo(30L);
      assertThat(stats.get("pendingContributions")).isEqualTo(11L);
    }
  }

  @Nested
  @DisplayName("Approve/Reject Image Contribution Tests")
  class ApproveRejectImageContributionTests {

    @Test
    @DisplayName("Should approve image contribution")
    void shouldApproveImageContribution() {
      // Given
      String contributionId = "1";
      ImageContribution contribution = ImageContribution.builder()
          .id(contributionId)
          .status("PENDING")
          .description("Test")
          .build();

      when(imageContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(imageContributionOutputPort.save(any(ImageContribution.class)))
          .thenReturn(contribution);

      // When
      contributionApplicationService.approveImageContribution(contributionId, "admin123");

      // Then
      verify(imageContributionOutputPort).save(any(ImageContribution.class));
    }

    @Test
    @DisplayName("Should reject image contribution with reason")
    void shouldRejectImageContributionWithReason() {
      // Given
      String contributionId = "1";
      ImageContribution contribution = ImageContribution.builder()
          .id(contributionId)
          .status("PENDING")
          .description("Test")
          .build();

      when(imageContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(imageContributionOutputPort.save(any(ImageContribution.class)))
          .thenReturn(contribution);

      // When
      contributionApplicationService.rejectImageContribution(
          contributionId, "Poor quality", "admin123");

      // Then
      verify(imageContributionOutputPort).save(any(ImageContribution.class));
    }
  }

  @Nested
  @DisplayName("Find By ID Tests")
  class FindByIdTests {

    @Test
    @DisplayName("Should find contribution by ID")
    void shouldFindContributionById() {
      // Given
      String contributionId = "1";
      ImageContribution contribution = ImageContribution.builder()
          .id(contributionId)
          .description("Test")
          .build();

      when(imageContributionOutputPort.findById(contributionId))
          .thenReturn(Optional.of(contribution));

      // When
      Optional<ImageContribution> result = contributionApplicationService
          .findById(contributionId);

      // Then
      assertThat(result).isPresent();
      assertThat(result.get().getId()).isEqualTo(contributionId);
    }

    @Test
    @DisplayName("Should return empty when contribution not found")
    void shouldReturnEmptyWhenContributionNotFound() {
      // Given
      when(imageContributionOutputPort.findById("nonexistent"))
          .thenReturn(Optional.empty());

      // When
      Optional<ImageContribution> result = contributionApplicationService
          .findById("nonexistent");

      // Then
      assertThat(result).isEmpty();
    }
  }
}
