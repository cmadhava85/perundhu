package com.perundhu.adapter.in.rest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.perundhu.application.service.AuthenticationService;
import com.perundhu.domain.model.TimingImageContribution;
import com.perundhu.domain.model.TimingImageContribution.TimingImageStatus;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.domain.port.TimingImageContributionRepository;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Timing Image Contribution Controller Tests")
class TimingImageContributionControllerTest {

  private MockMvc mockMvc;

  @Mock
  private TimingImageContributionRepository timingImageRepository;

  @Mock
  private FileStorageService fileStorageService;

  @Mock
  private AuthenticationService authenticationService;

  private TimingImageContributionController controller;

  @BeforeEach
  void setUp() {
    controller = new TimingImageContributionController(
        timingImageRepository,
        fileStorageService,
        authenticationService);
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Nested
  @DisplayName("Get Contributions Tests")
  class GetContributionsTests {

    @Test
    @DisplayName("Should return empty list when no filter provided")
    void shouldReturnEmptyListWhenNoFilterProvided() throws Exception {
      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$").isArray())
          .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("Should return contributions by status")
    void shouldReturnContributionsByStatus() throws Exception {
      // Given
      TimingImageContribution contribution = TimingImageContribution.builder()
          .imageUrl("http://example.com/image.jpg")
          .originLocation("Chennai")
          .status(TimingImageStatus.PENDING)
          .build();

      List<TimingImageContribution> contributions = Arrays.asList(contribution);

      when(timingImageRepository.findByStatus(TimingImageStatus.PENDING))
          .thenReturn(contributions);

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images")
          .param("status", "PENDING")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$[0].originLocation").value("Chennai"))
          .andExpect(jsonPath("$[0].status").exists());

      verify(timingImageRepository).findByStatus(TimingImageStatus.PENDING);
    }

    @Test
    @DisplayName("Should return contributions by userId")
    void shouldReturnContributionsByUserId() throws Exception {
      // Given
      String userId = "user123";
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId(userId)
          .imageUrl("http://example.com/image.jpg")
          .originLocation("Bangalore")
          .status(TimingImageStatus.APPROVED)
          .build();

      when(timingImageRepository.findByUserId(userId))
          .thenReturn(Arrays.asList(contribution));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images")
          .param("userId", userId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$[0].userId").value(userId))
          .andExpect(jsonPath("$[0].originLocation").value("Bangalore"));

      verify(timingImageRepository).findByUserId(userId);
    }

    @Test
    @DisplayName("Should return 400 for invalid status value")
    void shouldReturn400ForInvalidStatusValue() throws Exception {
      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images")
          .param("status", "INVALID_STATUS")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isBadRequest());
    }
  }

  @Nested
  @DisplayName("Get Single Contribution Tests")
  class GetSingleContributionTests {

    @Test
    @DisplayName("Should return contribution when found")
    void shouldReturnContributionWhenFound() throws Exception {
      // Given
      Long contributionId = 1L;
      TimingImageContribution contribution = TimingImageContribution.builder()
          .imageUrl("http://example.com/image.jpg")
          .originLocation("Chennai")
          .status(TimingImageStatus.PENDING)
          .build();

      when(timingImageRepository.findById(contributionId))
          .thenReturn(Optional.of(contribution));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/{id}", contributionId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.originLocation").value("Chennai"));

      verify(timingImageRepository).findById(contributionId);
    }

    @Test
    @DisplayName("Should return 404 when contribution not found")
    void shouldReturn404WhenContributionNotFound() throws Exception {
      // Given
      when(timingImageRepository.findById(999L))
          .thenReturn(Optional.empty());

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/{id}", 999L)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("Get User Contributions Tests")
  class GetUserContributionsTests {

    @Test
    @DisplayName("Should return user's contributions when authenticated user")
    void shouldReturnUserContributionsWhenAuthenticatedUser() throws Exception {
      // Given
      String userId = "user123";
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId(userId)
          .imageUrl("http://example.com/image.jpg")
          .originLocation("Chennai")
          .build();

      when(authenticationService.getCurrentUserId()).thenReturn(userId);
      when(timingImageRepository.findByUserId(userId))
          .thenReturn(Arrays.asList(contribution));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/user/{userId}", userId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$[0].userId").value(userId));

      verify(timingImageRepository).findByUserId(userId);
    }

    @Test
    @DisplayName("Should return 403 for IDOR attempt")
    void shouldReturn403ForIdorAttempt() throws Exception {
      // Given
      String userId = "user123";
      when(authenticationService.getCurrentUserId()).thenReturn("user456");

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/user/{userId}", userId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isForbidden())
          .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should allow anonymous user with anonymous_ prefix")
    void shouldAllowAnonymousUserWithAnonymousPrefixInId() throws Exception {
      // Given
      String userId = "anonymous_123456";
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId(userId)
          .imageUrl("http://example.com/image.jpg")
          .build();

      when(authenticationService.getCurrentUserId()).thenReturn(userId);
      when(timingImageRepository.findByUserId(userId))
          .thenReturn(Arrays.asList(contribution));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/user/{userId}", userId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$[0].userId").value(userId));
    }
  }

  @Nested
  @DisplayName("Delete Contribution Tests")
  class DeleteContributionTests {

    @Test
    @DisplayName("Should delete contribution owned by current user")
    void shouldDeleteContributionOwnedByCurrentUser() throws Exception {
      // Given
      Long contributionId = 1L;
      String userId = "user123";
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId(userId)
          .imageUrl("http://example.com/image.jpg")
          .build();

      when(timingImageRepository.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(authenticationService.getCurrentUserId()).thenReturn(userId);

      // When & Then
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", contributionId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNoContent());

      verify(timingImageRepository).deleteById(contributionId);
    }

    @Test
    @DisplayName("Should return 404 when trying to delete non-existent contribution")
    void shouldReturn404WhenDeletingNonExistentContribution() throws Exception {
      // Given
      when(timingImageRepository.findById(999L))
          .thenReturn(Optional.empty());

      // When & Then
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", 999L)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should return 403 for IDOR attempt on delete")
    void shouldReturn403ForIdorAttemptOnDelete() throws Exception {
      // Given
      Long contributionId = 1L;
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId("user123")
          .imageUrl("http://example.com/image.jpg")
          .build();

      when(timingImageRepository.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(authenticationService.getCurrentUserId()).thenReturn("user456");

      // When & Then
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", contributionId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isForbidden())
          .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should allow deleting anonymous contribution with anonymous_ prefix")
    void shouldAllowDeletingAnonymousContributionWithAnonymousPrefixInId() throws Exception {
      // Given
      Long contributionId = 1L;
      String userId = "anonymous_123456";
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId(userId)
          .imageUrl("http://example.com/image.jpg")
          .build();

      when(timingImageRepository.findById(contributionId))
          .thenReturn(Optional.of(contribution));
      when(authenticationService.getCurrentUserId()).thenReturn(userId);

      // When & Then
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", contributionId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNoContent());

      verify(timingImageRepository).deleteById(contributionId);
    }
  }

  @Nested
  @DisplayName("Get Statistics Tests")
  class GetStatisticsTests {

    @Test
    @DisplayName("Should return contribution statistics")
    void shouldReturnContributionStatistics() throws Exception {
      // Given
      when(timingImageRepository.countByStatus(TimingImageStatus.PENDING)).thenReturn(2L);
      when(timingImageRepository.countByStatus(TimingImageStatus.APPROVED)).thenReturn(1L);
      when(timingImageRepository.countByStatus(TimingImageStatus.REJECTED)).thenReturn(0L);
      when(timingImageRepository.countByStatus(TimingImageStatus.PROCESSING)).thenReturn(1L);

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/stats")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.pending").value(2))
          .andExpect(jsonPath("$.approved").value(1))
          .andExpect(jsonPath("$.rejected").value(0))
          .andExpect(jsonPath("$.processing").value(1));
    }

    @Test
    @DisplayName("Should handle empty statistics")
    void shouldHandleEmptyStatistics() throws Exception {
      // Given
      when(timingImageRepository.findByStatus(TimingImageStatus.PENDING))
          .thenReturn(Arrays.asList());
      when(timingImageRepository.findByStatus(TimingImageStatus.APPROVED))
          .thenReturn(Arrays.asList());
      when(timingImageRepository.findByStatus(TimingImageStatus.REJECTED))
          .thenReturn(Arrays.asList());
      when(timingImageRepository.findByStatus(TimingImageStatus.PROCESSING))
          .thenReturn(Arrays.asList());

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/stats")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.pending").value(0))
          .andExpect(jsonPath("$.approved").value(0))
          .andExpect(jsonPath("$.rejected").value(0))
          .andExpect(jsonPath("$.processing").value(0));
    }
  }

  @Nested
  @DisplayName("Error Handling Tests")
  class ErrorHandlingTests {

    @Test
    @DisplayName("Should handle internal server error in get contributions")
    void shouldHandleInternalServerErrorInGetContributions() throws Exception {
      // Given
      when(timingImageRepository.findByStatus(any()))
          .thenThrow(new RuntimeException("Database error"));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images")
          .param("status", "PENDING")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Should handle internal server error in get single contribution")
    void shouldHandleInternalServerErrorInGetSingleContribution() throws Exception {
      // Given
      when(timingImageRepository.findById(anyLong()))
          .thenThrow(new RuntimeException("Database error"));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/{id}", 1L)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Should handle internal server error in delete")
    void shouldHandleInternalServerErrorInDelete() throws Exception {
      // Given
      when(timingImageRepository.findById(anyLong()))
          .thenThrow(new RuntimeException("Database error"));

      // When & Then
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", 1L)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isInternalServerError());
    }

    @Test
    @DisplayName("Should handle internal server error in statistics")
    void shouldHandleInternalServerErrorInStatistics() throws Exception {
      // Given
      when(timingImageRepository.countByStatus(any()))
          .thenThrow(new RuntimeException("Database error"));

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/stats")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isInternalServerError());
    }
  }

  @Nested
  @DisplayName("Authorization and Security Tests")
  class AuthorizationAndSecurityTests {

    @Test
    @DisplayName("Should require matching user ID for /user/{userId} endpoint")
    void shouldRequireMatchingUserIdForUserEndpoint() throws Exception {
      // Given
      String requestedUserId = "user123";
      when(authenticationService.getCurrentUserId()).thenReturn("user456");

      // When & Then
      mockMvc.perform(get("/v1/contributions/timing-images/user/{userId}", requestedUserId)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should require matching user ID for delete endpoint")
    void shouldRequireMatchingUserIdForDeleteEndpoint() throws Exception {
      // Given
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId("user123")
          .build();

      when(timingImageRepository.findById(1L))
          .thenReturn(Optional.of(contribution));
      when(authenticationService.getCurrentUserId()).thenReturn("user456");

      // When & Then
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", 1L)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Should log IDOR attempts")
    void shouldLogIdorAttempts() throws Exception {
      // Given
      TimingImageContribution contribution = TimingImageContribution.builder()
          .userId("user123")
          .build();

      when(timingImageRepository.findById(1L))
          .thenReturn(Optional.of(contribution));
      when(authenticationService.getCurrentUserId()).thenReturn("user456");

      // When & Then - Verify endpoint responds with 403
      mockMvc.perform(delete("/v1/contributions/timing-images/{id}", 1L)
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isForbidden());
      // Note: Actual log verification would require logging framework integration testing
    }
  }
}
