package com.perundhu.infrastructure.persistence.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalTime;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for BusTimingRecordEntity
 */
class BusTimingRecordEntityTest {

  private BusTimingRecordEntity timingRecord;

  @BeforeEach
  void setUp() {
    timingRecord = new BusTimingRecordEntity();
  }

  @Test
  @DisplayName("Should create entity with builder pattern")
  void testBuilderPattern() {
    BusTimingRecordEntity entity = BusTimingRecordEntity.builder()
        .fromLocationId(1L)
        .fromLocationName("Chennai")
        .toLocationId(2L)
        .toLocationName("Coimbatore")
        .departureTime(LocalTime.of(5, 30))
        .timingType(BusTimingRecordEntity.TimingType.MORNING)
        .source(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED)
        .contributionId(100L)
        .verified(false)
        .build();

    assertNotNull(entity);
    assertEquals(1L, entity.getFromLocationId());
    assertEquals("Chennai", entity.getFromLocationName());
    assertEquals(2L, entity.getToLocationId());
    assertEquals("Coimbatore", entity.getToLocationName());
    assertEquals(LocalTime.of(5, 30), entity.getDepartureTime());
    assertEquals(BusTimingRecordEntity.TimingType.MORNING, entity.getTimingType());
    assertEquals(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED, entity.getSource());
  }

  @Test
  @DisplayName("Should set default values on creation")
  void testDefaultValues() {
    timingRecord.onCreate();

    assertFalse(timingRecord.getVerified());
    assertEquals(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED, timingRecord.getSource());
    assertNotNull(timingRecord.getLastUpdated());
  }

  @Test
  @DisplayName("Should update timestamp on modification")
  void testOnUpdate() throws InterruptedException {
    timingRecord.onCreate();
    LocalDateTime originalUpdatedAt = timingRecord.getLastUpdated();

    Thread.sleep(10);
    timingRecord.onUpdate();

    assertNotNull(timingRecord.getLastUpdated());
    assertTrue(timingRecord.getLastUpdated().isAfter(originalUpdatedAt));
  }

  @Test
  @DisplayName("Should handle all timing types")
  void testTimingTypes() {
    timingRecord.setTimingType(BusTimingRecordEntity.TimingType.MORNING);
    assertEquals(BusTimingRecordEntity.TimingType.MORNING, timingRecord.getTimingType());

    timingRecord.setTimingType(BusTimingRecordEntity.TimingType.AFTERNOON);
    assertEquals(BusTimingRecordEntity.TimingType.AFTERNOON, timingRecord.getTimingType());

    timingRecord.setTimingType(BusTimingRecordEntity.TimingType.NIGHT);
    assertEquals(BusTimingRecordEntity.TimingType.NIGHT, timingRecord.getTimingType());
  }

  @Test
  @DisplayName("Should handle all timing sources")
  void testTimingSources() {
    timingRecord.setSource(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED);
    assertEquals(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED, timingRecord.getSource());

    timingRecord.setSource(BusTimingRecordEntity.TimingSource.USER_CONTRIBUTION);
    assertEquals(BusTimingRecordEntity.TimingSource.USER_CONTRIBUTION, timingRecord.getSource());

    timingRecord.setSource(BusTimingRecordEntity.TimingSource.OFFICIAL);
    assertEquals(BusTimingRecordEntity.TimingSource.OFFICIAL, timingRecord.getSource());
  }

  @Test
  @DisplayName("Should handle time values correctly")
  void testTimeValues() {
    LocalTime departure = LocalTime.of(5, 30);
    LocalTime arrival = LocalTime.of(11, 45);

    timingRecord.setDepartureTime(departure);
    timingRecord.setArrivalTime(arrival);

    assertEquals(departure, timingRecord.getDepartureTime());
    assertEquals(arrival, timingRecord.getArrivalTime());

    // Verify time is before arrival
    assertTrue(timingRecord.getDepartureTime().isBefore(timingRecord.getArrivalTime()));
  }

  @Test
  @DisplayName("Should handle bus association")
  void testBusAssociation() {
    timingRecord.setBusId(42L);
    assertEquals(42L, timingRecord.getBusId());
  }

  @Test
  @DisplayName("Should track contribution source")
  void testContributionTracking() {
    timingRecord.setContributionId(100L);
    timingRecord.setSource(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED);

    assertEquals(100L, timingRecord.getContributionId());
    assertEquals(BusTimingRecordEntity.TimingSource.OCR_EXTRACTED, timingRecord.getSource());
  }
}
