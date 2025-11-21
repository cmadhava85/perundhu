package com.perundhu.domain.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for SkippedTimingRecord domain model
 */
class SkippedTimingRecordTest {

  @Test
  @DisplayName("Should create with default constructor")
  void testDefaultConstructor() {
    SkippedTimingRecord record = new SkippedTimingRecord();

    assertNotNull(record);
    assertNotNull(record.getSkippedAt());
  }

  @Test
  @DisplayName("Should build with builder pattern")
  void testBuilderPattern() {
    SkippedTimingRecord record = SkippedTimingRecord.builder()
        .contributionId(100L)
        .fromLocationId(1L)
        .fromLocationName("Chennai")
        .toLocationId(2L)
        .toLocationName("Coimbatore")
        .departureTime(LocalTime.of(5, 30))
        .timingType(BusTimingRecord.TimingType.MORNING)
        .skipReason(SkippedTimingRecord.SkipReason.DUPLICATE_EXACT)
        .existingRecordId(50L)
        .existingRecordSource(BusTimingRecord.TimingSource.OFFICIAL)
        .processedBy("admin@example.com")
        .notes("Duplicate found")
        .build();

    assertEquals(100L, record.getContributionId());
    assertEquals(1L, record.getFromLocationId());
    assertEquals("Chennai", record.getFromLocationName());
    assertEquals(SkippedTimingRecord.SkipReason.DUPLICATE_EXACT, record.getSkipReason());
    assertEquals(50L, record.getExistingRecordId());
  }

  @Test
  @DisplayName("Should handle all skip reasons")
  void testSkipReasons() {
    SkippedTimingRecord record = new SkippedTimingRecord();

    record.setSkipReason(SkippedTimingRecord.SkipReason.DUPLICATE_EXACT);
    assertEquals(SkippedTimingRecord.SkipReason.DUPLICATE_EXACT, record.getSkipReason());

    record.setSkipReason(SkippedTimingRecord.SkipReason.DUPLICATE_SIMILAR);
    assertEquals(SkippedTimingRecord.SkipReason.DUPLICATE_SIMILAR, record.getSkipReason());

    record.setSkipReason(SkippedTimingRecord.SkipReason.INVALID_TIME);
    assertEquals(SkippedTimingRecord.SkipReason.INVALID_TIME, record.getSkipReason());

    record.setSkipReason(SkippedTimingRecord.SkipReason.INVALID_LOCATION);
    assertEquals(SkippedTimingRecord.SkipReason.INVALID_LOCATION, record.getSkipReason());
  }
}
