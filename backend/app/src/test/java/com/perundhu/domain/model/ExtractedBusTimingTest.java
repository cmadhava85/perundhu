package com.perundhu.domain.model;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;

import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Unit tests for ExtractedBusTiming domain model
 */
class ExtractedBusTimingTest {

  @Test
  @DisplayName("Should create with default constructor")
  void testDefaultConstructor() {
    ExtractedBusTiming timing = new ExtractedBusTiming();

    assertNotNull(timing);
    assertNotNull(timing.getMorningTimings());
    assertNotNull(timing.getAfternoonTimings());
    assertNotNull(timing.getNightTimings());
    assertTrue(timing.getMorningTimings().isEmpty());
    assertTrue(timing.getAfternoonTimings().isEmpty());
    assertTrue(timing.getNightTimings().isEmpty());
  }

  @Test
  @DisplayName("Should build with builder pattern")
  void testBuilderPattern() {
    List<String> morningTimings = Arrays.asList("05:30", "06:15", "07:00");
    List<String> afternoonTimings = Arrays.asList("12:30", "13:15");
    List<String> nightTimings = Arrays.asList("18:30", "19:15", "20:00");

    ExtractedBusTiming timing = ExtractedBusTiming.builder()
        .destination("Coimbatore")
        .destinationTamil("கோயம்புத்தூர்")
        .morningTimings(morningTimings)
        .afternoonTimings(afternoonTimings)
        .nightTimings(nightTimings)
        .build();

    assertEquals("Coimbatore", timing.getDestination());
    assertEquals("கோயம்புத்தூர்", timing.getDestinationTamil());
    assertEquals(3, timing.getMorningTimings().size());
    assertEquals(2, timing.getAfternoonTimings().size());
    assertEquals(3, timing.getNightTimings().size());
  }

  @Test
  @DisplayName("Should handle all timing categories")
  void testTimingCategories() {
    ExtractedBusTiming timing = new ExtractedBusTiming();

    timing.setMorningTimings(Arrays.asList("05:30", "07:00"));
    timing.setAfternoonTimings(Arrays.asList("12:30", "14:00", "15:30"));
    timing.setNightTimings(Arrays.asList("18:30"));

    assertEquals(2, timing.getMorningTimings().size());
    assertEquals(3, timing.getAfternoonTimings().size());
    assertEquals(1, timing.getNightTimings().size());

    assertTrue(timing.getMorningTimings().contains("05:30"));
    assertTrue(timing.getAfternoonTimings().contains("14:00"));
    assertTrue(timing.getNightTimings().contains("18:30"));
  }

  @Test
  @DisplayName("Should handle Tamil and English names")
  void testDestinationNames() {
    ExtractedBusTiming timing = new ExtractedBusTiming();

    timing.setDestination("Madurai");
    timing.setDestinationTamil("மதுரை");

    assertEquals("Madurai", timing.getDestination());
    assertEquals("மதுரை", timing.getDestinationTamil());
  }
}
