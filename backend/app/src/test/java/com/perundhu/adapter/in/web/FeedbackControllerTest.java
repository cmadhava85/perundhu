package com.perundhu.adapter.in.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
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

import com.perundhu.domain.model.UserFeedback;
import com.perundhu.domain.model.UserFeedback.FeedbackStatus;
import com.perundhu.domain.port.FileStorageService;
import com.perundhu.domain.port.UserFeedbackOutputPort;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Feedback Controller Tests")
class FeedbackControllerTest {

  private MockMvc mockMvc;

  @Mock
  private UserFeedbackOutputPort feedbackOutputPort;

  @Mock
  private FileStorageService fileStorageService;

  private FeedbackController controller;

  @BeforeEach
  void setUp() {
    controller = new FeedbackController(feedbackOutputPort, fileStorageService);
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Nested
  @DisplayName("Submit Feedback Tests")
  class SubmitFeedbackTests {

    @Test
    @DisplayName("Should reject feedback with empty message")
    void shouldRejectFeedbackWithEmptyMessage() throws Exception {
      // When
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "")
          .param("email", "test@example.com"))
          // Then
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should reject feedback with empty email")
    void shouldRejectFeedbackWithEmptyEmail() throws Exception {
      // When
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test message")
          .param("email", ""))
          // Then
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should reject feedback with invalid email format")
    void shouldRejectFeedbackWithInvalidEmailFormat() throws Exception {
      // When
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test message")
          .param("email", "invalid-email"))
          // Then
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should accept feedback with valid data")
    void shouldAcceptFeedbackWithValidData() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("bug")
          .message("Test message")
          .email("test@example.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test message")
          .param("email", "test@example.com"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true))
          .andExpect(jsonPath("$.feedbackId").value(1L));

      verify(feedbackOutputPort).saveFeedback(any(UserFeedback.class));
    }

    @Test
    @DisplayName("Should handle feedback with special characters in message")
    void shouldHandleFeedbackWithSpecialCharactersInMessage() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("suggestion")
          .message("Test with special chars: !@#$%^&*()")
          .email("test@example.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "suggestion")
          .param("message", "Test with special chars: !@#$%^&*()")
          .param("email", "test@example.com"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @DisplayName("Should trim whitespace from message")
    void shouldTrimWhitespaceFromMessage() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("general")
          .message("Trimmed message")
          .email("test@example.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "general")
          .param("message", "   Trimmed message   ")
          .param("email", "test@example.com"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success").value(true));
    }
  }

  @Nested
  @DisplayName("Get Feedback Tests")
  class GetFeedbackTests {

    @Test
    @DisplayName("Should return feedback when found")
    void shouldReturnFeedbackWhenFound() throws Exception {
      // Given
      UserFeedback feedback = UserFeedback.builder()
          .id(1L)
          .category("bug")
          .message("Test bug report")
          .email("test@example.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.findFeedbackById(1L))
          .thenReturn(Optional.of(feedback));

      // When & Then
      mockMvc.perform(get("/api/feedback/1")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.id").value(1L))
          .andExpect(jsonPath("$.message").value("Test bug report"))
          .andExpect(jsonPath("$.email").value("test@example.com"));

      verify(feedbackOutputPort).findFeedbackById(1L);
    }

    @Test
    @DisplayName("Should return 404 when feedback not found")
    void shouldReturn404WhenFeedbackNotFound() throws Exception {
      // Given
      when(feedbackOutputPort.findFeedbackById(999L))
          .thenReturn(Optional.empty());

      // When & Then
      mockMvc.perform(get("/api/feedback/999")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("Get Feedback Statistics Tests")
  class GetFeedbackStatisticsTests {

    @Test
    @DisplayName("Should return feedback statistics")
    void shouldReturnFeedbackStatistics() throws Exception {
      // Given
      when(feedbackOutputPort.countFeedbackByStatus("new")).thenReturn(5L);
      when(feedbackOutputPort.countFeedbackByStatus("acknowledged")).thenReturn(3L);
      when(feedbackOutputPort.countFeedbackByStatus("under_review")).thenReturn(2L);
      when(feedbackOutputPort.countFeedbackByStatus("resolved")).thenReturn(10L);
      when(feedbackOutputPort.countFeedbackByCategory("suggestion")).thenReturn(4L);
      when(feedbackOutputPort.countFeedbackByCategory("bug")).thenReturn(8L);
      when(feedbackOutputPort.countFeedbackByCategory("feature")).thenReturn(5L);
      when(feedbackOutputPort.countFeedbackByCategory("general")).thenReturn(3L);

      // When & Then
      mockMvc.perform(get("/api/feedback/stats/overview")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.newCount").value(5))
          .andExpect(jsonPath("$.acknowledgedCount").value(3))
          .andExpect(jsonPath("$.underReviewCount").value(2))
          .andExpect(jsonPath("$.resolvedCount").value(10))
          .andExpect(jsonPath("$.suggestionCount").value(4))
          .andExpect(jsonPath("$.bugCount").value(8))
          .andExpect(jsonPath("$.featureCount").value(5))
          .andExpect(jsonPath("$.generalCount").value(3));
    }

    @Test
    @DisplayName("Should handle statistics with zero counts")
    void shouldHandleStatisticsWithZeroCounts() throws Exception {
      // Given
      when(feedbackOutputPort.countFeedbackByStatus("new")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByStatus("acknowledged")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByStatus("under_review")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByStatus("resolved")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByCategory("suggestion")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByCategory("bug")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByCategory("feature")).thenReturn(0L);
      when(feedbackOutputPort.countFeedbackByCategory("general")).thenReturn(0L);

      // When & Then
      mockMvc.perform(get("/api/feedback/stats/overview")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.newCount").value(0))
          .andExpect(jsonPath("$.resolvedCount").value(0));
    }
  }

  @Nested
  @DisplayName("Email Validation Tests")
  class EmailValidationTests {

    @Test
    @DisplayName("Should accept valid email formats")
    void shouldAcceptValidEmailFormats() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("bug")
          .message("Test")
          .email("user@domain.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test")
          .param("email", "user@domain.com"))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should accept email with plus addressing")
    void shouldAcceptEmailWithPlusAddressing() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("bug")
          .message("Test")
          .email("user+tag@domain.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test")
          .param("email", "user+tag@domain.com"))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should reject email without @ symbol")
    void shouldRejectEmailWithoutAtSymbol() throws Exception {
      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test")
          .param("email", "userdomain.com"))
          .andExpect(status().isBadRequest());
    }
  }

  @Nested
  @DisplayName("Optional Fields Tests")
  class OptionalFieldsTests {

    @Test
    @DisplayName("Should handle feedback without optional fields")
    void shouldHandleFeedbackWithoutOptionalFields() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("general")
          .message("Test message")
          .email("test@example.com")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "general")
          .param("message", "Test message")
          .param("email", "test@example.com"))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should accept feedback with userAgent")
    void shouldAcceptFeedbackWithUserAgent() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("bug")
          .message("Test")
          .email("test@example.com")
          .userAgent("Mozilla/5.0")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test")
          .param("email", "test@example.com")
          .param("userAgent", "Mozilla/5.0"))
          .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Should accept feedback with pageUrl")
    void shouldAcceptFeedbackWithPageUrl() throws Exception {
      // Given
      UserFeedback testFeedback = UserFeedback.builder()
          .id(1L)
          .category("suggestion")
          .message("Test")
          .email("test@example.com")
          .pageUrl("http://example.com/page")
          .status(FeedbackStatus.NEW)
          .createdAt(LocalDateTime.now())
          .build();

      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenReturn(testFeedback);

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "suggestion")
          .param("message", "Test")
          .param("email", "test@example.com")
          .param("pageUrl", "http://example.com/page"))
          .andExpect(status().isOk());
    }
  }

  @Nested
  @DisplayName("Error Handling Tests")
  class ErrorHandlingTests {

    @Test
    @DisplayName("Should handle internal server error during save")
    void shouldHandleInternalServerErrorDuringSave() throws Exception {
      // Given
      when(feedbackOutputPort.saveFeedback(any(UserFeedback.class)))
          .thenThrow(new RuntimeException("Database error"));

      // When & Then
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test")
          .param("email", "test@example.com"))
          .andExpect(status().isInternalServerError())
          .andExpect(jsonPath("$.error").exists());
    }

    @Test
    @DisplayName("Should handle missing required parameters")
    void shouldHandleMissingRequiredParameters() throws Exception {
      // When & Then - Missing email parameter
      mockMvc.perform(post("/api/feedback")
          .contentType(MediaType.APPLICATION_FORM_URLENCODED)
          .param("category", "bug")
          .param("message", "Test"))
          .andExpect(status().isBadRequest());
    }
  }
}
