package com.perundhu.domain.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalTime;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BusTimingRecord domain model
 */
class BusTimingRecordTest {

  @Test
  @DisplayName("Should create with default constructor")
  void testDefaultConstructor() {
    BusTimingRecord record = new BusTimingRecord();

    assertNotNull(record);
    assertFalse(record.getVerified());
    assertEquals(BusTimingRecord.TimingSource.OCR_EXTRACTED, record.getSource());
    assertNotNull(record.getLastUpdated());
  }

  @Test
  @DisplayName("Should build with builder pattern")
  void testBuilderPattern() {
    BusTimingRecord record = BusTimingRecord.builder()
        .fromLocationId(1L)
        .fromLocationName("Chennai")
        .toLocationId(2L)
        .toLocationName("Coimbatore")
        .departureTime(LocalTime.of(5, 30))
        .timingType(BusTimingRecord.TimingType.MORNING)
        .source(BusTimingRecord.TimingSource.OCR_EXTRACTED)
        .contributionId(100L)
        .build();

    assertEquals(1L, record.getFromLocationId());
    assertEquals("Chennai", record.getFromLocationName());
    assertEquals(2L, record.getToLocationId());
    assertEquals("Coimbatore", record.getToLocationName());
    assertEquals(LocalTime.of(5, 30), record.getDepartureTime());
    assertEquals(BusTimingRecord.TimingType.MORNING, record.getTimingType());
  }

  @Test
  @DisplayName("Should handle all timing types")
  void testTimingTypes() {
    BusTimingRecord record = new BusTimingRecord();

    record.setTimingType(BusTimingRecord.TimingType.MORNING);
    assertEquals(BusTimingRecord.TimingType.MORNING, record.getTimingType());

    record.setTimingType(BusTimingRecord.TimingType.AFTERNOON);
    assertEquals(BusTimingRecord.TimingType.AFTERNOON, record.getTimingType());

    record.setTimingType(BusTimingRecord.TimingType.NIGHT);
    assertEquals(BusTimingRecord.TimingType.NIGHT, record.getTimingType());
  }

  @Test
  @DisplayName("Should handle all timing sources")
  void testTimingSources() {
    BusTimingRecord record = new BusTimingRecord();

    record.setSource(BusTimingRecord.TimingSource.OCR_EXTRACTED);
    assertEquals(BusTimingRecord.TimingSource.OCR_EXTRACTED, record.getSource());

    record.setSource(BusTimingRecord.TimingSource.USER_CONTRIBUTION);
    assertEquals(BusTimingRecord.TimingSource.USER_CONTRIBUTION, record.getSource());

    record.setSource(BusTimingRecord.TimingSource.OFFICIAL);
    assertEquals(BusTimingRecord.TimingSource.OFFICIAL, record.getSource());
  }
}
