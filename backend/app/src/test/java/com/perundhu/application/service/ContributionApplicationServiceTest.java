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
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.RouteContributionOutputPort;
import com.perundhu.domain.port.SecurityMonitoringPort;
import com.perundhu.domain.port.RouteContributionInputPort;
import com.perundhu.domain.port.ImageContributionInputPort;
import com.perundhu.domain.port.ContributionQueryPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("Contribution Application Service Tests - Legacy Delegation Adapter")
@SuppressWarnings("deprecation") // This test intentionally tests the legacy delegation class
class ContributionApplicationServiceTest {

  @Mock
  private RouteContributionInputPort routeContributionService;

  @Mock
  private ImageContributionInputPort imageContributionService;

  @Mock
  private ContributionQueryPort contributionQueryService;

  @Mock
  private RouteContributionOutputPort routeContributionOutputPort;

  @Mock
  private ImageContributionOutputPort imageContributionOutputPort;

  private ContributionApplicationService contributionApplicationService;

  @BeforeEach
  void setUp() {
    contributionApplicationService = new ContributionApplicationService(
        routeContributionService,
        imageContributionService,
        contributionQueryService,
        routeContributionOutputPort,
        imageContributionOutputPort);
  }

  @Nested
  @DisplayName("Submit Route Contribution Tests")
  class SubmitRouteContributionTests {

    @Test
    @DisplayName("Should delegate route contribution to RouteContributionService")
    void shouldDelegateRouteContributionToService() {
      // Given
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("busNumber", "BUS001");
      contributionData.put("busName", "Express");
      contributionData.put("fromLocationName", "Chennai");
      contributionData.put("toLocationName", "Bangalore");

      RouteContribution expectedContribution = RouteContribution.builder()
          .id(UUID.randomUUID().toString())
          .busNumber("BUS001")
          .status("PENDING")
          .userId("user123")
          .submissionDate(LocalDateTime.now())
          .build();

      when(routeContributionService.submitRouteContribution(contributionData, "user123"))
          .thenReturn(expectedContribution);

      // When
      RouteContribution result = contributionApplicationService
          .submitRouteContribution(contributionData, "user123");

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getBusNumber()).isEqualTo("BUS001");
      assertThat(result.getStatus()).isEqualTo("PENDING");
      verify(routeContributionService).submitRouteContribution(contributionData, "user123");
    }

    @Test
    @DisplayName("Should delegate validation to RouteContributionService")
    void shouldDelegateValidationToService() {
      // Given
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("busNumber", "");

      when(routeContributionService.submitRouteContribution(contributionData, "user123"))
          .thenThrow(new IllegalArgumentException("Invalid contribution data"));

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
    @DisplayName("Should delegate image contribution to ImageContributionService")
    void shouldDelegateImageContributionToService() {
      // Given
      Map<String, Object> contributionData = new HashMap<>();
      contributionData.put("description", "Test image");
      contributionData.put("location", "Chennai");
      contributionData.put("imageUrl", "http://example.com/image.jpg");

      ImageContribution expectedContribution = ImageContribution.builder()
          .id(UUID.randomUUID().toString())
          .description("Test image")
          .status("PENDING")
          .userId("user123")
          .submissionDate(LocalDateTime.now())
          .build();

      when(imageContributionService.submitImageContribution(contributionData, "user123"))
          .thenReturn(expectedContribution);

      // When
      ImageContribution result = contributionApplicationService
          .submitImageContribution(contributionData, "user123");

      // Then
      assertThat(result).isNotNull();
      assertThat(result.getDescription()).isEqualTo("Test image");
      assertThat(result.getStatus()).isEqualTo("PENDING");
      verify(imageContributionService).submitImageContribution(contributionData, "user123");
    }
  }

  @Nested
  @DisplayName("Get User Contributions Tests")
  class GetUserContributionsTests {

    @Test
    @DisplayName("Should delegate get user contributions to ContributionQueryService")
    void shouldDelegateGetUserContributionsToService() {
      // Given
      String userId = "user123";
      List<Map<String, Object>> expectedContributions = List.of(
          Map.of("id", "1", "type", "ROUTE", "status", "APPROVED"),
          Map.of("id", "2", "type", "IMAGE", "status", "PENDING")
      );

      when(contributionQueryService.getUserContributions(userId))
          .thenReturn(expectedContributions);

      // When
      List<Map<String, Object>> result = contributionApplicationService
          .getUserContributions(userId);

      // Then
      assertThat(result).hasSize(2);
      verify(contributionQueryService).getUserContributions(userId);
    }

    @Test
    @DisplayName("Should return empty list when user has no contributions")
    void shouldReturnEmptyListWhenUserHasNoContributions() {
      // Given
      String userId = "nonexistent";

      when(contributionQueryService.getUserContributions(userId))
          .thenReturn(new ArrayList<>());

      // When
      List<Map<String, Object>> result = contributionApplicationService
          .getUserContributions(userId);

      // Then
      assertThat(result).isEmpty();
      verify(contributionQueryService).getUserContributions(userId);
    }
  }

  @Nested
  @DisplayName("Update Contribution Status Tests")
  class UpdateContributionStatusTests {

    @Test
    @DisplayName("Should delegate approve route to RouteContributionService")
    void shouldDelegateApproveRouteToService() {
      // Given
      String contributionId = "1";

      // When
      contributionApplicationService.approveRouteContribution(contributionId, "admin123");

      // Then
      verify(routeContributionService).approveRouteContribution(contributionId, "admin123");
    }

    @Test
    @DisplayName("Should delegate reject route to RouteContributionService")
    void shouldDelegateRejectRouteToService() {
      // Given
      String contributionId = "1";

      // When
      contributionApplicationService.rejectRouteContribution(
          contributionId, "Incomplete information", "admin123");

      // Then
      verify(routeContributionService).rejectRouteContribution(
          contributionId, "Incomplete information", "admin123");
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
    @DisplayName("Should delegate get pending route contributions to ContributionQueryService")
    void shouldDelegateGetPendingRouteContributionsToService() {
      // Given
      List<RouteContribution> pendingRoutes = List.of(
          RouteContribution.builder()
              .id("1")
              .status("PENDING")
              .busNumber("BUS001")
              .build()
      );

      when(contributionQueryService.getPendingRouteContributions())
          .thenReturn(pendingRoutes);

      // When
      List<RouteContribution> result = contributionApplicationService
          .getPendingRouteContributions();

      // Then
      assertThat(result).hasSize(1);
      assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
      verify(contributionQueryService).getPendingRouteContributions();
    }

    @Test
    @DisplayName("Should delegate get pending image contributions to ContributionQueryService")
    void shouldDelegateGetPendingImageContributionsToService() {
      // Given
      List<ImageContribution> pendingImages = List.of(
          ImageContribution.builder()
              .id("1")
              .status("PENDING")
              .description("Test image")
              .build()
      );

      when(contributionQueryService.getPendingImageContributions())
          .thenReturn(pendingImages);

      // When
      List<ImageContribution> result = contributionApplicationService
          .getPendingImageContributions();

      // Then
      assertThat(result).hasSize(1);
      assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
      verify(contributionQueryService).getPendingImageContributions();
    }
  }

  @Nested
  @DisplayName("Get All Contributions Tests")
  class GetAllContributionsTests {

    @Test
    @DisplayName("Should delegate get all contributions to ContributionQueryService")
    void shouldDelegateGetAllContributionsToService() {
      // Given
      List<Map<String, Object>> allContributions = List.of(
          Map.of("id", "1", "type", "ROUTE"),
          Map.of("id", "2", "type", "IMAGE")
      );

      when(contributionQueryService.getAllContributions())
          .thenReturn(allContributions);

      // When
      List<Map<String, Object>> result = contributionApplicationService.getAllContributions();

      // Then
      assertThat(result).hasSize(2);
      verify(contributionQueryService).getAllContributions();
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
    @DisplayName("Should delegate approve image to ImageContributionService")
    void shouldDelegateApproveImageToService() {
      // Given
      String contributionId = "1";

      // When
      contributionApplicationService.approveImageContribution(contributionId, "admin123");

      // Then
      verify(imageContributionService).approveImageContribution(contributionId, "admin123");
    }

    @Test
    @DisplayName("Should delegate reject image to ImageContributionService")
    void shouldDelegateRejectImageToService() {
      // Given
      String contributionId = "1";

      // When
      contributionApplicationService.rejectImageContribution(
          contributionId, "Poor quality", "admin123");

      // Then
      verify(imageContributionService).rejectImageContribution(
          contributionId, "Poor quality", "admin123");
    }
  }

  @Nested
  @DisplayName("Find By ID Tests")
  class FindByIdTests {

    @Test
    @DisplayName("Should delegate find by ID to ImageContributionService")
    void shouldDelegateFindByIdToService() {
      // Given
      String contributionId = "1";
      ImageContribution contribution = ImageContribution.builder()
          .id(contributionId)
          .description("Test")
          .build();

      when(imageContributionService.findById(contributionId))
          .thenReturn(Optional.of(contribution));

      // When
      Optional<ImageContribution> result = contributionApplicationService
          .findById(contributionId);

      // Then
      assertThat(result).isPresent();
      assertThat(result.get().getId()).isEqualTo(contributionId);
      verify(imageContributionService).findById(contributionId);
    }

    @Test
    @DisplayName("Should return empty when contribution not found")
    void shouldReturnEmptyWhenContributionNotFound() {
      // Given
      when(imageContributionService.findById("nonexistent"))
          .thenReturn(Optional.empty());

      // When
      Optional<ImageContribution> result = contributionApplicationService
          .findById("nonexistent");

      // Then
      assertThat(result).isEmpty();
      verify(imageContributionService).findById("nonexistent");
    }
  }
}
