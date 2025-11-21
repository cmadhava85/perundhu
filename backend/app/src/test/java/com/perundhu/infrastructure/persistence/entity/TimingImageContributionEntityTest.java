package com.perundhu.infrastructure.persistence.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for TimingImageContributionEntity
 */
class TimingImageContributionEntityTest {

  private TimingImageContributionEntity contribution;

  @BeforeEach
  void setUp() {
    contribution = new TimingImageContributionEntity();
  }

  @Test
  @DisplayName("Should create entity with builder pattern")
  void testBuilderPattern() {
    TimingImageContributionEntity entity = TimingImageContributionEntity.builder()
        .userId("user123")
        .imageUrl("https://example.com/image.jpg")
        .originLocation("Chennai")
        .originLocationTamil("சென்னை")
        .description("Bus timing board from Chennai bus stand")
        .status(TimingImageContributionEntity.TimingImageStatus.PENDING)
        .submittedBy("john.doe@example.com")
        .build();

    assertNotNull(entity);
    assertEquals("user123", entity.getUserId());
    assertEquals("https://example.com/image.jpg", entity.getImageUrl());
    assertEquals("Chennai", entity.getOriginLocation());
    assertEquals("சென்னை", entity.getOriginLocationTamil());
    assertEquals(TimingImageContributionEntity.TimingImageStatus.PENDING, entity.getStatus());
  }

  @Test
  @DisplayName("Should set default values on creation")
  void testDefaultValues() {
    contribution.onCreate();

    assertNotNull(contribution.getCreatedAt());
    assertNotNull(contribution.getUpdatedAt());
    assertNotNull(contribution.getSubmissionDate());
    assertEquals(TimingImageContributionEntity.TimingImageStatus.PENDING, contribution.getStatus());
    assertFalse(contribution.getRequiresManualReview());
    assertEquals(0, contribution.getMergedRecords());
    assertEquals(0, contribution.getCreatedRecords());
  }

  @Test
  @DisplayName("Should update timestamp on modification")
  void testOnUpdate() throws InterruptedException {
    contribution.onCreate();
    LocalDateTime originalUpdatedAt = contribution.getUpdatedAt();

    Thread.sleep(10); // Small delay to ensure different timestamp
    contribution.onUpdate();

    assertNotNull(contribution.getUpdatedAt());
    assertTrue(contribution.getUpdatedAt().isAfter(originalUpdatedAt));
  }

  @Test
  @DisplayName("Should handle extracted timings relationship")
  void testExtractedTimingsRelationship() {
    contribution.setExtractedTimings(new ArrayList<>());

    ExtractedBusTimingEntity timing = new ExtractedBusTimingEntity();
    timing.setDestination("Coimbatore");
    timing.setContribution(contribution);

    contribution.getExtractedTimings().add(timing);

    assertEquals(1, contribution.getExtractedTimings().size());
    assertEquals("Coimbatore", contribution.getExtractedTimings().get(0).getDestination());
  }

  @Test
  @DisplayName("Should handle all board types")
  void testBoardTypes() {
    contribution.setBoardType(TimingImageContributionEntity.BoardType.GOVERNMENT);
    assertEquals(TimingImageContributionEntity.BoardType.GOVERNMENT, contribution.getBoardType());

    contribution.setBoardType(TimingImageContributionEntity.BoardType.PRIVATE);
    assertEquals(TimingImageContributionEntity.BoardType.PRIVATE, contribution.getBoardType());

    contribution.setBoardType(TimingImageContributionEntity.BoardType.LOCAL);
    assertEquals(TimingImageContributionEntity.BoardType.LOCAL, contribution.getBoardType());

    contribution.setBoardType(TimingImageContributionEntity.BoardType.INTER_CITY);
    assertEquals(TimingImageContributionEntity.BoardType.INTER_CITY, contribution.getBoardType());
  }

  @Test
  @DisplayName("Should handle all status types")
  void testStatusTypes() {
    contribution.setStatus(TimingImageContributionEntity.TimingImageStatus.PENDING);
    assertEquals(TimingImageContributionEntity.TimingImageStatus.PENDING, contribution.getStatus());

    contribution.setStatus(TimingImageContributionEntity.TimingImageStatus.PROCESSING);
    assertEquals(TimingImageContributionEntity.TimingImageStatus.PROCESSING, contribution.getStatus());

    contribution.setStatus(TimingImageContributionEntity.TimingImageStatus.APPROVED);
    assertEquals(TimingImageContributionEntity.TimingImageStatus.APPROVED, contribution.getStatus());

    contribution.setStatus(TimingImageContributionEntity.TimingImageStatus.REJECTED);
    assertEquals(TimingImageContributionEntity.TimingImageStatus.REJECTED, contribution.getStatus());
  }

  @Test
  @DisplayName("Should handle duplicate check status")
  void testDuplicateCheckStatus() {
    contribution.setDuplicateCheckStatus(TimingImageContributionEntity.DuplicateCheckStatus.CHECKED);
    assertEquals(TimingImageContributionEntity.DuplicateCheckStatus.CHECKED, contribution.getDuplicateCheckStatus());

    contribution.setDuplicateCheckStatus(TimingImageContributionEntity.DuplicateCheckStatus.DUPLICATES_FOUND);
    assertEquals(TimingImageContributionEntity.DuplicateCheckStatus.DUPLICATES_FOUND,
        contribution.getDuplicateCheckStatus());

    contribution.setDuplicateCheckStatus(TimingImageContributionEntity.DuplicateCheckStatus.UNIQUE);
    assertEquals(TimingImageContributionEntity.DuplicateCheckStatus.UNIQUE, contribution.getDuplicateCheckStatus());
  }

  @Test
  @DisplayName("Should handle OCR confidence")
  void testOcrConfidence() {
    BigDecimal confidence = new BigDecimal("0.85");
    contribution.setOcrConfidence(confidence);

    assertEquals(confidence, contribution.getOcrConfidence());
    assertEquals(0, confidence.compareTo(new BigDecimal("0.85")));
  }

  @Test
  @DisplayName("Should handle geographic coordinates")
  void testGeographicCoordinates() {
    BigDecimal latitude = new BigDecimal("13.0827");
    BigDecimal longitude = new BigDecimal("80.2707");

    contribution.setOriginLatitude(latitude);
    contribution.setOriginLongitude(longitude);

    assertEquals(latitude, contribution.getOriginLatitude());
    assertEquals(longitude, contribution.getOriginLongitude());
  }

  @Test
  @DisplayName("Should track processed information")
  void testProcessedInformation() {
    LocalDateTime processedDate = LocalDateTime.now();
    String processedBy = "admin@example.com";

    contribution.setProcessedDate(processedDate);
    contribution.setProcessedBy(processedBy);
    contribution.setCreatedRecords(5);
    contribution.setMergedRecords(2);

    assertEquals(processedDate, contribution.getProcessedDate());
    assertEquals(processedBy, contribution.getProcessedBy());
    assertEquals(5, contribution.getCreatedRecords());
    assertEquals(2, contribution.getMergedRecords());
  }
}
