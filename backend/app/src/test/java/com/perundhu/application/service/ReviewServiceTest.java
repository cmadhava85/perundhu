package com.perundhu.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.Review;
import com.perundhu.domain.model.ReviewId;
import com.perundhu.domain.port.ReviewRepository;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewService Unit Tests")
class ReviewServiceTest {
    
    @Mock
    private ReviewRepository reviewRepository;
    
    private ReviewService reviewService;
    
    @BeforeEach
    void setUp() {
        reviewService = new ReviewService(reviewRepository);
    }
    
    // ============ submitReview Tests ============
    
    @Test
    @DisplayName("Should submit a new review successfully")
    void testSubmitReview_Success() {
        // Arrange
        Long busId = 1L;
        String userId = "user123";
        int rating = 5;
        String comment = "Great bus service!";
        List<String> tags = Arrays.asList("clean", "punctual");
        LocalDate travelDate = LocalDate.now().minusDays(1);
        boolean autoApprove = true;
        
        Review expectedReview = Review.builder()
                .id(ReviewId.of(1L))
                .busId(busId)
                .userId(userId)
                .rating(rating)
                .comment(comment)
                .tags(tags)
                .travelDate(travelDate)
                .status(Review.ReviewStatus.APPROVED)
                .build();
        
        when(reviewRepository.existsByBusIdAndUserId(busId, userId)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(expectedReview);
        
        // Act
        Review result = reviewService.submitReview(
                busId, userId, rating, comment, tags, travelDate, autoApprove);
        
        // Assert
        assertNotNull(result);
        assertEquals(busId, result.getBusId());
        assertEquals(userId, result.getUserId());
        assertEquals(rating, result.getRating());
        assertEquals(Review.ReviewStatus.APPROVED, result.getStatus());
        
        verify(reviewRepository, times(1)).existsByBusIdAndUserId(busId, userId);
        verify(reviewRepository, times(1)).save(any(Review.class));
    }
    
    @Test
    @DisplayName("Should set PENDING status when autoApprove is false")
    void testSubmitReview_PendingApproval() {
        // Arrange
        Long busId = 1L;
        String userId = "user456";
        int rating = 4;
        boolean autoApprove = false;
        
        Review expectedReview = Review.builder()
                .busId(busId)
                .userId(userId)
                .rating(rating)
                .status(Review.ReviewStatus.PENDING)
                .build();
        
        when(reviewRepository.existsByBusIdAndUserId(busId, userId)).thenReturn(false);
        when(reviewRepository.save(any(Review.class))).thenReturn(expectedReview);
        
        // Act
        Review result = reviewService.submitReview(busId, userId, rating, null, null, null, autoApprove);
        
        // Assert
        assertEquals(Review.ReviewStatus.PENDING, result.getStatus());
    }
    
    @Test
    @DisplayName("Should prevent duplicate reviews from same user")
    void testSubmitReview_DuplicatePrevention() {
        // Arrange
        Long busId = 1L;
        String userId = "user123";
        int rating = 3;
        
        when(reviewRepository.existsByBusIdAndUserId(busId, userId)).thenReturn(true);
        
        // Act & Assert
        IllegalStateException exception = assertThrows(
                IllegalStateException.class,
                () -> reviewService.submitReview(busId, userId, rating, null, null, null, true)
        );
        
        assertTrue(exception.getMessage().contains("already reviewed"));
        verify(reviewRepository, never()).save(any());
    }
    
    @Test
    @DisplayName("Should allow anonymous reviews (userId null)")
    void testSubmitReview_Anonymous() {
        // Arrange
        Long busId = 1L;
        String userId = null;
        int rating = 4;
        
        Review expectedReview = Review.builder()
                .busId(busId)
                .userId(null)
                .rating(rating)
                .status(Review.ReviewStatus.APPROVED)
                .build();
        
        when(reviewRepository.save(any(Review.class))).thenReturn(expectedReview);
        
        // Act
        Review result = reviewService.submitReview(busId, userId, rating, null, null, null, true);
        
        // Assert
        assertNull(result.getUserId());
        verify(reviewRepository, never()).existsByBusIdAndUserId(anyLong(), anyString());
    }
    
    // ============ getApprovedReviewsForBus Tests ============
    
    @Test
    @DisplayName("Should get all approved reviews for a bus")
    void testGetApprovedReviewsForBus() {
        // Arrange
        Long busId = 1L;
        List<Review> expectedReviews = Arrays.asList(
                Review.builder().id(ReviewId.of(1L)).busId(busId).rating(5).status(Review.ReviewStatus.APPROVED).build(),
                Review.builder().id(ReviewId.of(2L)).busId(busId).rating(4).status(Review.ReviewStatus.APPROVED).build()
        );
        
        when(reviewRepository.findApprovedByBusId(busId)).thenReturn(expectedReviews);
        
        // Act
        List<Review> result = reviewService.getApprovedReviewsForBus(busId);
        
        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(r -> r.getStatus() == Review.ReviewStatus.APPROVED));
        verify(reviewRepository, times(1)).findApprovedByBusId(busId);
    }
    
    @Test
    @DisplayName("Should return empty list when no approved reviews exist")
    void testGetApprovedReviewsForBus_Empty() {
        // Arrange
        Long busId = 999L;
        when(reviewRepository.findApprovedByBusId(busId)).thenReturn(Arrays.asList());
        
        // Act
        List<Review> result = reviewService.getApprovedReviewsForBus(busId);
        
        // Assert
        assertTrue(result.isEmpty());
    }
    
    // ============ getRatingSummary Tests ============
    
    @Test
    @DisplayName("Should calculate rating summary correctly")
    void testGetRatingSummary() {
        // Arrange
        Long busId = 1L;
        Double averageRating = 4.5;
        long reviewCount = 10L;
        
        when(reviewRepository.calculateAverageRating(busId)).thenReturn(averageRating);
        when(reviewRepository.countApprovedByBusId(busId)).thenReturn(reviewCount);
        
        // Act
        ReviewService.RatingSummary result = reviewService.getRatingSummary(busId);
        
        // Assert
        assertEquals(averageRating, result.averageRating());
        assertEquals(reviewCount, result.reviewCount());
        assertEquals("4.5", result.getFormattedRating());
    }
    
    @Test
    @DisplayName("Should handle null average rating (no reviews)")
    void testGetRatingSummary_NoReviews() {
        // Arrange
        Long busId = 999L;
        when(reviewRepository.calculateAverageRating(busId)).thenReturn(null);
        when(reviewRepository.countApprovedByBusId(busId)).thenReturn(0L);
        
        // Act
        ReviewService.RatingSummary result = reviewService.getRatingSummary(busId);
        
        // Assert
        assertEquals(0.0, result.averageRating());
        assertEquals(0, result.reviewCount());
    }
    
    // ============ getReviewsByUser Tests ============
    
    @Test
    @DisplayName("Should get all reviews by user")
    void testGetReviewsByUser() {
        // Arrange
        String userId = "user123";
        List<Review> expectedReviews = Arrays.asList(
                Review.builder().id(ReviewId.of(1L)).busId(1L).userId(userId).rating(5).build(),
                Review.builder().id(ReviewId.of(2L)).busId(1L).userId(userId).rating(4).build()
        );
        
        when(reviewRepository.findByUserId(userId)).thenReturn(expectedReviews);
        
        // Act
        List<Review> result = reviewService.getReviewsByUser(userId);
        
        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(r -> r.getUserId().equals(userId)));
    }
    
    // ============ approveReview Tests ============
    
    @Test
    @DisplayName("Should approve a pending review")
    void testApproveReview() {
        // Arrange
        Long reviewId = 1L;
        Review pendingReview = Review.builder()
                .id(ReviewId.of(reviewId))
                .busId(1L)
                .rating(3)
                .status(Review.ReviewStatus.PENDING)
                .build();
        
        Review approvedReview = Review.builder()
                .id(ReviewId.of(reviewId))
                .busId(1L)
                .rating(3)
                .status(Review.ReviewStatus.APPROVED)
                .build();
        
        when(reviewRepository.findById(ReviewId.of(reviewId))).thenReturn(Optional.of(pendingReview));
        when(reviewRepository.save(any(Review.class))).thenReturn(approvedReview);
        
        // Act
        Review result = reviewService.approveReview(reviewId);
        
        // Assert
        assertEquals(Review.ReviewStatus.APPROVED, result.getStatus());
        verify(reviewRepository, times(1)).save(any(Review.class));
    }
    
    @Test
    @DisplayName("Should throw exception when review not found for approval")
    void testApproveReview_NotFound() {
        // Arrange
        Long reviewId = 999L;
        when(reviewRepository.findById(ReviewId.of(reviewId))).thenReturn(Optional.empty());
        
        // Act & Assert
        assertThrows(
                IllegalArgumentException.class,
                () -> reviewService.approveReview(reviewId)
        );
    }
    
    // ============ rejectReview Tests ============
    
    @Test
    @DisplayName("Should reject a pending review")
    void testRejectReview() {
        // Arrange
        Long reviewId = 1L;
        Review pendingReview = Review.builder()
                .id(ReviewId.of(reviewId))
                .busId(1L)
                .rating(3)
                .status(Review.ReviewStatus.PENDING)
                .build();
        
        Review rejectedReview = Review.builder()
                .id(ReviewId.of(reviewId))
                .busId(1L)
                .rating(3)
                .status(Review.ReviewStatus.REJECTED)
                .build();
        
        when(reviewRepository.findById(ReviewId.of(reviewId))).thenReturn(Optional.of(pendingReview));
        when(reviewRepository.save(any(Review.class))).thenReturn(rejectedReview);
        
        // Act
        Review result = reviewService.rejectReview(reviewId);
        
        // Assert
        assertEquals(Review.ReviewStatus.REJECTED, result.getStatus());
    }
    
    // ============ deleteReview Tests ============
    
    @Test
    @DisplayName("Should delete review by owner")
    void testDeleteReview_Owner() {
        // Arrange
        Long reviewId = 1L;
        String userId = "user123";
        Review review = Review.builder()
                .id(ReviewId.of(reviewId))
                .busId(1L)
                .userId(userId)
                .rating(5)
                .build();
        
        when(reviewRepository.findById(ReviewId.of(reviewId))).thenReturn(Optional.of(review));
        
        // Act
        reviewService.deleteReview(reviewId, userId);
        
        // Assert
        verify(reviewRepository, times(1)).deleteById(ReviewId.of(reviewId));
    }
    
    @Test
    @DisplayName("Should prevent deletion by non-owner")
    void testDeleteReview_NotOwner() {
        // Arrange
        Long reviewId = 1L;
        String reviewOwner = "user123";
        String otherUser = "user456";
        Review review = Review.builder()
                .id(ReviewId.of(reviewId))
                .busId(1L)
                .userId(reviewOwner)
                .rating(4)
                .build();
        
        when(reviewRepository.findById(ReviewId.of(reviewId))).thenReturn(Optional.of(review));
        
        // Act & Assert
        assertThrows(
                IllegalStateException.class,
                () -> reviewService.deleteReview(reviewId, otherUser)
        );
        
        verify(reviewRepository, never()).deleteById(any());
    }
    
    // ============ hasUserReviewedBus Tests ============
    
    @Test
    @DisplayName("Should confirm user has reviewed bus")
    void testHasUserReviewedBus_True() {
        // Arrange
        Long busId = 1L;
        String userId = "user123";
        when(reviewRepository.existsByBusIdAndUserId(busId, userId)).thenReturn(true);
        
        // Act
        boolean result = reviewService.hasUserReviewedBus(busId, userId);
        
        // Assert
        assertTrue(result);
    }
    
    @Test
    @DisplayName("Should confirm user has NOT reviewed bus")
    void testHasUserReviewedBus_False() {
        // Arrange
        Long busId = 1L;
        String userId = "user456";
        when(reviewRepository.existsByBusIdAndUserId(busId, userId)).thenReturn(false);
        
        // Act
        boolean result = reviewService.hasUserReviewedBus(busId, userId);
        
        // Assert
        assertFalse(result);
    }
    
    @Test
    @DisplayName("Should return false for null or blank userId")
    void testHasUserReviewedBus_NullUser() {
        // Arrange & Act
        boolean resultNull = reviewService.hasUserReviewedBus(1L, null);
        boolean resultBlank = reviewService.hasUserReviewedBus(1L, "");
        
        // Assert
        assertFalse(resultNull);
        assertFalse(resultBlank);
        verify(reviewRepository, never()).existsByBusIdAndUserId(anyLong(), anyString());
    }
    
    // ============ getPendingReviews Tests ============
    
    @Test
    @DisplayName("Should get all pending reviews for admin")
    void testGetPendingReviews() {
        // Arrange
        List<Review> pendingReviews = Arrays.asList(
                Review.builder().id(ReviewId.of(1L)).busId(1L).rating(3).status(Review.ReviewStatus.PENDING).build(),
                Review.builder().id(ReviewId.of(2L)).busId(1L).rating(4).status(Review.ReviewStatus.PENDING).build()
        );
        
        when(reviewRepository.findPendingReviews()).thenReturn(pendingReviews);
        
        // Act
        List<Review> result = reviewService.getPendingReviews();
        
        // Assert
        assertEquals(2, result.size());
        assertTrue(result.stream().allMatch(r -> r.getStatus() == Review.ReviewStatus.PENDING));
    }
}
