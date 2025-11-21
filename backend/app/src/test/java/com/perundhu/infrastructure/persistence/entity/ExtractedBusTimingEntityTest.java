package com.perundhu.infrastructure.persistence.entity;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ExtractedBusTimingEntity
 */
class ExtractedBusTimingEntityTest {

  private ExtractedBusTimingEntity extractedTiming;

  @BeforeEach
  void setUp() {
    extractedTiming = new ExtractedBusTimingEntity();
  }

  @Test
  @DisplayName("Should create entity with builder pattern")
  void testBuilderPattern() {
    List<String> morningTimings = Arrays.asList("05:30", "06:15", "07:00");
    List<String> afternoonTimings = Arrays.asList("12:30", "13:15", "14:00");
    List<String> nightTimings = Arrays.asList("18:30", "19:15", "20:00");

    ExtractedBusTimingEntity entity = ExtractedBusTimingEntity.builder()
        .destination("Coimbatore")
        .destinationTamil("கோயம்புத்தூர்")
        .morningTimings(morningTimings)
        .afternoonTimings(afternoonTimings)
        .nightTimings(nightTimings)
        .build();

    assertNotNull(entity);
    assertEquals("Coimbatore", entity.getDestination());
    assertEquals("கோயம்புத்தூர்", entity.getDestinationTamil());
    assertEquals(3, entity.getMorningTimings().size());
    assertEquals(3, entity.getAfternoonTimings().size());
    assertEquals(3, entity.getNightTimings().size());
  }

  @Test
  @DisplayName("Should initialize empty timing lists on creation")
  void testDefaultTimingLists() {
    extractedTiming.onCreate();

    assertNotNull(extractedTiming.getMorningTimings());
    assertNotNull(extractedTiming.getAfternoonTimings());
    assertNotNull(extractedTiming.getNightTimings());
    assertTrue(extractedTiming.getMorningTimings().isEmpty());
    assertTrue(extractedTiming.getAfternoonTimings().isEmpty());
    assertTrue(extractedTiming.getNightTimings().isEmpty());
    assertNotNull(extractedTiming.getCreatedAt());
  }

  @Test
  @DisplayName("Should handle morning timings correctly")
  void testMorningTimings() {
    List<String> morningTimings = Arrays.asList("05:30", "06:15", "07:00", "08:30");
    extractedTiming.setMorningTimings(morningTimings);

    assertEquals(4, extractedTiming.getMorningTimings().size());
    assertTrue(extractedTiming.getMorningTimings().contains("05:30"));
    assertTrue(extractedTiming.getMorningTimings().contains("08:30"));
  }

  @Test
  @DisplayName("Should handle afternoon timings correctly")
  void testAfternoonTimings() {
    List<String> afternoonTimings = Arrays.asList("12:30", "13:15", "14:00", "15:30");
    extractedTiming.setAfternoonTimings(afternoonTimings);

    assertEquals(4, extractedTiming.getAfternoonTimings().size());
    assertTrue(extractedTiming.getAfternoonTimings().contains("12:30"));
    assertTrue(extractedTiming.getAfternoonTimings().contains("15:30"));
  }

  @Test
  @DisplayName("Should handle night timings correctly")
  void testNightTimings() {
    List<String> nightTimings = Arrays.asList("18:30", "19:15", "20:00", "21:30");
    extractedTiming.setNightTimings(nightTimings);

    assertEquals(4, extractedTiming.getNightTimings().size());
    assertTrue(extractedTiming.getNightTimings().contains("18:30"));
    assertTrue(extractedTiming.getNightTimings().contains("21:30"));
  }

  @Test
  @DisplayName("Should handle contribution relationship")
  void testContributionRelationship() {
    TimingImageContributionEntity contribution = new TimingImageContributionEntity();
    contribution.setId(100L);
    contribution.setOriginLocation("Chennai");

    extractedTiming.setContribution(contribution);

    assertNotNull(extractedTiming.getContribution());
    assertEquals(100L, extractedTiming.getContribution().getId());
    assertEquals("Chennai", extractedTiming.getContribution().getOriginLocation());
  }

  @Test
  @DisplayName("Should handle Tamil and English destination names")
  void testDestinationNames() {
    extractedTiming.setDestination("Coimbatore");
    extractedTiming.setDestinationTamil("கோயம்புத்தூர்");

    assertEquals("Coimbatore", extractedTiming.getDestination());
    assertEquals("கோயம்புத்தூர்", extractedTiming.getDestinationTamil());
  }

  @Test
  @DisplayName("Should store creation timestamp")
  void testCreationTimestamp() {
    LocalDateTime beforeCreate = LocalDateTime.now();
    extractedTiming.onCreate();
    LocalDateTime afterCreate = LocalDateTime.now();

    assertNotNull(extractedTiming.getCreatedAt());
    assertTrue(extractedTiming.getCreatedAt().isAfter(beforeCreate.minusSeconds(1)));
    assertTrue(extractedTiming.getCreatedAt().isBefore(afterCreate.plusSeconds(1)));
  }

  @Test
  @DisplayName("Should handle mixed timing categories")
  void testMixedTimings() {
    extractedTiming.setMorningTimings(Arrays.asList("05:30", "07:00"));
    extractedTiming.setAfternoonTimings(Arrays.asList("12:30", "14:00", "15:30"));
    extractedTiming.setNightTimings(Arrays.asList("18:30"));

    assertEquals(2, extractedTiming.getMorningTimings().size());
    assertEquals(3, extractedTiming.getAfternoonTimings().size());
    assertEquals(1, extractedTiming.getNightTimings().size());

    // Total timings
    int totalTimings = extractedTiming.getMorningTimings().size() +
        extractedTiming.getAfternoonTimings().size() +
        extractedTiming.getNightTimings().size();
    assertEquals(6, totalTimings);
  }
}
