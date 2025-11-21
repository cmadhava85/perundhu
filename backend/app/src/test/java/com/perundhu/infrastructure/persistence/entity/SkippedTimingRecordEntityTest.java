package com.perundhu.infrastructure.persistence.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalTime;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SkippedTimingRecordEntity
 */
class SkippedTimingRecordEntityTest {

  private SkippedTimingRecordEntity skippedRecord;

  @BeforeEach
  void setUp() {
    skippedRecord = new SkippedTimingRecordEntity();
  }

  @Test
  @DisplayName("Should create entity with builder pattern")
  void testBuilderPattern() {
    SkippedTimingRecordEntity entity = SkippedTimingRecordEntity.builder()
        .contributionId(100L)
        .fromLocationId(1L)
        .fromLocationName("Chennai")
        .toLocationId(2L)
        .toLocationName("Coimbatore")
        .departureTime(LocalTime.of(5, 30))
        .timingType(BusTimingRecordEntity.TimingType.MORNING)
        .skipReason(SkippedTimingRecordEntity.SkipReason.DUPLICATE_EXACT)
        .existingRecordId(50L)
        .existingRecordSource(BusTimingRecordEntity.TimingSource.OFFICIAL)
        .processedBy("admin@example.com")
        .notes("Exact duplicate found")
        .build();

    assertNotNull(entity);
    assertEquals(100L, entity.getContributionId());
    assertEquals(1L, entity.getFromLocationId());
    assertEquals("Chennai", entity.getFromLocationName());
    assertEquals(SkippedTimingRecordEntity.SkipReason.DUPLICATE_EXACT, entity.getSkipReason());
    assertEquals(50L, entity.getExistingRecordId());
  }

  @Test
  @DisplayName("Should set default timestamp on creation")
  void testDefaultTimestamp() {
    skippedRecord.onCreate();

    assertNotNull(skippedRecord.getSkippedAt());
    assertTrue(skippedRecord.getSkippedAt().isBefore(LocalDateTime.now().plusSeconds(1)));
  }

  @Test
  @DisplayName("Should handle all skip reasons")
  void testSkipReasons() {
    skippedRecord.setSkipReason(SkippedTimingRecordEntity.SkipReason.DUPLICATE_EXACT);
    assertEquals(SkippedTimingRecordEntity.SkipReason.DUPLICATE_EXACT, skippedRecord.getSkipReason());

    skippedRecord.setSkipReason(SkippedTimingRecordEntity.SkipReason.DUPLICATE_SIMILAR);
    assertEquals(SkippedTimingRecordEntity.SkipReason.DUPLICATE_SIMILAR, skippedRecord.getSkipReason());

    skippedRecord.setSkipReason(SkippedTimingRecordEntity.SkipReason.INVALID_TIME);
    assertEquals(SkippedTimingRecordEntity.SkipReason.INVALID_TIME, skippedRecord.getSkipReason());

    skippedRecord.setSkipReason(SkippedTimingRecordEntity.SkipReason.INVALID_LOCATION);
    assertEquals(SkippedTimingRecordEntity.SkipReason.INVALID_LOCATION, skippedRecord.getSkipReason());
  }

  @Test
  @DisplayName("Should track existing record information")
  void testExistingRecordInfo() {
    skippedRecord.setExistingRecordId(42L);
    skippedRecord.setExistingRecordSource(BusTimingRecordEntity.TimingSource.OFFICIAL);

    assertEquals(42L, skippedRecord.getExistingRecordId());
    assertEquals(BusTimingRecordEntity.TimingSource.OFFICIAL, skippedRecord.getExistingRecordSource());
  }

  @Test
  @DisplayName("Should store skip notes")
  void testSkipNotes() {
    String notes = "Skipped because timing already exists from official source";
    skippedRecord.setNotes(notes);

    assertEquals(notes, skippedRecord.getNotes());
  }

  @Test
  @DisplayName("Should track processor information")
  void testProcessorInfo() {
    String processor = "admin@example.com";
    LocalDateTime skippedAt = LocalDateTime.now();

    skippedRecord.setProcessedBy(processor);
    skippedRecord.setSkippedAt(skippedAt);

    assertEquals(processor, skippedRecord.getProcessedBy());
    assertEquals(skippedAt, skippedRecord.getSkippedAt());
  }

  @Test
  @DisplayName("Should handle route information")
  void testRouteInfo() {
    skippedRecord.setFromLocationId(1L);
    skippedRecord.setFromLocationName("Chennai");
    skippedRecord.setToLocationId(2L);
    skippedRecord.setToLocationName("Coimbatore");
    skippedRecord.setDepartureTime(LocalTime.of(5, 30));
    skippedRecord.setTimingType(BusTimingRecordEntity.TimingType.MORNING);

    assertEquals(1L, skippedRecord.getFromLocationId());
    assertEquals("Chennai", skippedRecord.getFromLocationName());
    assertEquals(2L, skippedRecord.getToLocationId());
    assertEquals("Coimbatore", skippedRecord.getToLocationName());
    assertEquals(LocalTime.of(5, 30), skippedRecord.getDepartureTime());
    assertEquals(BusTimingRecordEntity.TimingType.MORNING, skippedRecord.getTimingType());
  }
}
