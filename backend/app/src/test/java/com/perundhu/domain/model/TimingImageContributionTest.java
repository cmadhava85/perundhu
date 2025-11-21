package com.perundhu.domain.model;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TimingImageContribution domain model
 */
class TimingImageContributionTest {

  private TimingImageContribution contribution;

  @BeforeEach
  void setUp() {
    contribution = new TimingImageContribution();
  }

  @Test
  @DisplayName("Should create with default constructor")
  void testDefaultConstructor() {
    assertNotNull(contribution);
    assertEquals(TimingImageContribution.TimingImageStatus.PENDING, contribution.getStatus());
    assertNotNull(contribution.getSubmissionDate());
    assertFalse(contribution.getRequiresManualReview());
    assertEquals(0, contribution.getMergedRecords());
    assertEquals(0, contribution.getCreatedRecords());
    assertNotNull(contribution.getExtractedTimings());
  }

  @Test
  @DisplayName("Should build with builder pattern")
  void testBuilderPattern() {
    TimingImageContribution built = TimingImageContribution.builder()
        .userId("user123")
        .imageUrl("https://example.com/image.jpg")
        .originLocation("Chennai")
        .originLocationTamil("சென்னை")
        .description("Test description")
        .status(TimingImageContribution.TimingImageStatus.PENDING)
        .submittedBy("test@example.com")
        .build();

    assertEquals("user123", built.getUserId());
    assertEquals("https://example.com/image.jpg", built.getImageUrl());
    assertEquals("Chennai", built.getOriginLocation());
    assertEquals("சென்னை", built.getOriginLocationTamil());
    assertEquals(TimingImageContribution.TimingImageStatus.PENDING, built.getStatus());
  }

  @Test
  @DisplayName("Should handle all fields correctly")
  void testAllFields() {
    contribution.setId(1L);
    contribution.setUserId("user123");
    contribution.setImageUrl("https://example.com/image.jpg");
    contribution.setThumbnailUrl("https://example.com/thumb.jpg");
    contribution.setOriginLocation("Chennai");
    contribution.setOriginLocationTamil("சென்னை");
    contribution.setBoardType(TimingImageContribution.BoardType.GOVERNMENT);
    contribution.setDescription("Test board");
    contribution.setStatus(TimingImageContribution.TimingImageStatus.APPROVED);
    contribution.setProcessedBy("admin");
    contribution.setOcrConfidence(BigDecimal.valueOf(0.95));
    contribution.setRequiresManualReview(true);
    contribution.setCreatedRecords(10);
    contribution.setMergedRecords(2);

    assertEquals(1L, contribution.getId());
    assertEquals("user123", contribution.getUserId());
    assertEquals("Chennai", contribution.getOriginLocation());
    assertEquals(TimingImageContribution.BoardType.GOVERNMENT, contribution.getBoardType());
    assertEquals(TimingImageContribution.TimingImageStatus.APPROVED, contribution.getStatus());
    assertTrue(contribution.getRequiresManualReview());
    assertEquals(10, contribution.getCreatedRecords());
  }

  @Test
  @DisplayName("Should handle extracted timings list")
  void testExtractedTimingsList() {
    ExtractedBusTiming timing1 = ExtractedBusTiming.builder()
        .destination("Coimbatore")
        .build();

    ExtractedBusTiming timing2 = ExtractedBusTiming.builder()
        .destination("Madurai")
        .build();

    contribution.getExtractedTimings().add(timing1);
    contribution.getExtractedTimings().add(timing2);

    assertEquals(2, contribution.getExtractedTimings().size());
    assertEquals("Coimbatore", contribution.getExtractedTimings().get(0).getDestination());
    assertEquals("Madurai", contribution.getExtractedTimings().get(1).getDestination());
  }
}
