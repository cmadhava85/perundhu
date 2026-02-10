package com.perundhu.adapter.in.rest;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.test.web.servlet.MockMvc;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.service.ReviewService;
import com.perundhu.domain.model.Review;
import com.perundhu.domain.model.ReviewId;

@SpringBootTest(properties = { "spring.flyway.enabled=false" })
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Disabled("ReviewControllerTest has circular dependency issues with Flyway and EntityManagerFactory - needs migration config fixes")
@DisplayName("ReviewController Integration Tests")
class ReviewControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockitoBean
    private ReviewService reviewService;

    @Autowired
    private ReviewController reviewController;

    @BeforeEach
    void setUp() {
        // Enable reviews feature for tests
        ReflectionTestUtils.setField(reviewController, "reviewsEnabled", true);
        ReflectionTestUtils.setField(reviewController, "requireLogin", true);
        ReflectionTestUtils.setField(reviewController, "autoApprove", true);
    }

    // ============ Feature Status Tests ============

    @Test
    @DisplayName("Should return feature status")
    void testGetFeatureStatus() throws Exception {
        mockMvc.perform(get("/api/reviews/feature-status"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.requireLogin").value(true))
                .andExpect(jsonPath("$.autoApprove").value(true));
    }

    // ============ Submit Review Tests ============

    @Test
    @DisplayName("Should submit review successfully")
    void testSubmitReview_Success() throws Exception {
        // Arrange
        Review review = Review.builder()
                .id(ReviewId.of(1L))
                .busId(1L)
                .userId("user123")
                .rating(5)
                .comment("Great service!")
                .status(Review.ReviewStatus.APPROVED)
                .build();

        when(reviewService.submitReview(anyLong(), anyString(), anyInt(), anyString(), anyList(), any(), anyBoolean()))
                .thenReturn(review);

        String requestBody = """
                    {
                        "busId": 1,
                        "rating": 5,
                        "comment": "Great service!",
                        "tags": ["clean", "punctual"],
                        "travelDate": "2026-01-04"
                    }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/reviews")
                .header("X-User-Id", "user123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("Should reject review when feature disabled")
    void testSubmitReview_FeatureDisabled() throws Exception {
        // Arrange
        ReflectionTestUtils.setField(reviewController, "reviewsEnabled", false);

        String requestBody = """
                    {
                        "busId": 1,
                        "rating": 5,
                        "comment": "Great service!"
                    }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/reviews")
                .header("X-User-Id", "user123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.message").value("Reviews feature is currently disabled"));
    }

    @Test
    @DisplayName("Should reject review without login when required")
    void testSubmitReview_LoginRequired() throws Exception {
        // Arrange - requireLogin is true by default
        ReflectionTestUtils.setField(reviewController, "requireLogin", true);

        String requestBody = """
                    {
                        "busId": 1,
                        "rating": 5,
                        "comment": "Great service!"
                    }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/reviews")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Please log in to submit a review"));
    }

    @Test
    @DisplayName("Should validate rating between 1-5")
    void testSubmitReview_InvalidRating() throws Exception {
        String requestBody = """
                    {
                        "busId": 1,
                        "rating": 10,
                        "comment": "Invalid rating"
                    }
                """;

        // Act & Assert
        mockMvc.perform(post("/api/reviews")
                .header("X-User-Id", "user123")
                .contentType(MediaType.APPLICATION_JSON)
                .content(requestBody))
                .andExpect(status().isBadRequest());
    }

    // ============ Get Reviews Tests ============

    @Test
    @DisplayName("Should get reviews for bus")
    void testGetReviewsForBus() throws Exception {
        // Arrange
        List<Review> reviews = Arrays.asList(
                Review.builder().id(ReviewId.of(1L)).busId(1L).rating(5).build(),
                Review.builder().id(ReviewId.of(2L)).busId(1L).rating(4).build());

        when(reviewService.getApprovedReviewsForBus(1L)).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/bus/1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].rating").value(5))
                .andExpect(jsonPath("$[1].rating").value(4));
    }

    @Test
    @DisplayName("Should return empty list when no reviews")
    void testGetReviewsForBus_Empty() throws Exception {
        // Arrange
        when(reviewService.getApprovedReviewsForBus(999L)).thenReturn(Arrays.asList());

        // Act & Assert
        mockMvc.perform(get("/api/reviews/bus/999"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    // ============ Rating Summary Tests ============

    @Test
    @DisplayName("Should get rating summary")
    void testGetRatingSummary() throws Exception {
        // Arrange
        ReviewService.RatingSummary summary = new ReviewService.RatingSummary(4.5, 10);
        when(reviewService.getRatingSummary(1L)).thenReturn(summary);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/bus/1/summary"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(4.5))
                .andExpect(jsonPath("$.reviewCount").value(10))
                .andExpect(jsonPath("$.formattedRating").value("4.5"));
    }

    // ============ Has Reviewed Tests ============

    @Test
    @DisplayName("Should check if user has reviewed bus")
    void testHasReviewedBus() throws Exception {
        // Arrange
        when(reviewService.hasUserReviewedBus(1L, "user123")).thenReturn(true);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/bus/1/has-reviewed")
                .header("X-User-Id", "user123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.hasReviewed").value(true));
    }

    @Test
    @DisplayName("Should require login for has-reviewed check")
    void testHasReviewedBus_LoginRequired() throws Exception {
        ReflectionTestUtils.setField(reviewController, "requireLogin", true);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/bus/1/has-reviewed"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Please log in to check review status"));
    }

    // ============ My Reviews Tests ============

    @Test
    @DisplayName("Should get user's reviews")
    void testGetMyReviews() throws Exception {
        // Arrange
        List<Review> reviews = Arrays.asList(
                Review.builder().id(ReviewId.of(1L)).userId("user123").rating(5).build(),
                Review.builder().id(ReviewId.of(2L)).userId("user123").rating(4).build());

        when(reviewService.getReviewsByUser("user123")).thenReturn(reviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/my-reviews")
                .header("X-User-Id", "user123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("Should require authentication for my-reviews")
    void testGetMyReviews_Unauthorized() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/api/reviews/my-reviews"))
                .andExpect(status().isUnauthorized());
    }

    // ============ Delete Review Tests ============

    @Test
    @DisplayName("Should delete user's review")
    void testDeleteReview() throws Exception {
        // Arrange
        doNothing().when(reviewService).deleteReview(1L, "user123");

        // Act & Assert
        mockMvc.perform(delete("/api/reviews/1")
                .header("X-User-Id", "user123"))
                .andExpect(status().isNoContent());

        verify(reviewService, times(1)).deleteReview(1L, "user123");
    }

    @Test
    @DisplayName("Should prevent deletion by non-owner")
    void testDeleteReview_NotOwner() throws Exception {
        // Arrange
        doThrow(new IllegalStateException("You can only delete your own reviews"))
                .when(reviewService).deleteReview(1L, "otherUser");

        // Act & Assert
        mockMvc.perform(delete("/api/reviews/1")
                .header("X-User-Id", "otherUser"))
                .andExpect(status().isForbidden());
    }

    // ============ Admin Endpoints Tests ============

    @Test
    @DisplayName("Should get pending reviews (admin)")
    void testGetPendingReviews() throws Exception {
        // Arrange
        List<Review> pendingReviews = Arrays.asList(
                Review.builder().id(ReviewId.of(1L)).status(Review.ReviewStatus.PENDING).build(),
                Review.builder().id(ReviewId.of(2L)).status(Review.ReviewStatus.PENDING).build());

        when(reviewService.getPendingReviews()).thenReturn(pendingReviews);

        // Act & Assert
        mockMvc.perform(get("/api/reviews/admin/pending"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].status").value("PENDING"));
    }

    @Test
    @DisplayName("Should approve review (admin)")
    void testApproveReview() throws Exception {
        // Arrange
        Review approvedReview = Review.builder()
                .id(ReviewId.of(1L))
                .status(Review.ReviewStatus.APPROVED)
                .build();

        when(reviewService.approveReview(1L)).thenReturn(approvedReview);

        // Act & Assert
        mockMvc.perform(put("/api/reviews/admin/1/approve"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));
    }

    @Test
    @DisplayName("Should reject review (admin)")
    void testRejectReview() throws Exception {
        // Arrange
        Review rejectedReview = Review.builder()
                .id(ReviewId.of(1L))
                .status(Review.ReviewStatus.REJECTED)
                .build();

        when(reviewService.rejectReview(1L)).thenReturn(rejectedReview);

        // Act & Assert
        mockMvc.perform(put("/api/reviews/admin/1/reject"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"));
    }

    @Test
    @DisplayName("Should return 404 when approving non-existent review")
    void testApproveReview_NotFound() throws Exception {
        // Arrange
        when(reviewService.approveReview(999L))
                .thenThrow(new IllegalArgumentException("Review not found"));

        // Act & Assert
        mockMvc.perform(put("/api/reviews/admin/999/approve"))
                .andExpect(status().isNotFound());
    }
}
