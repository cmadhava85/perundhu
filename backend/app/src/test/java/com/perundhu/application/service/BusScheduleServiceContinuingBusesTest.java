package com.perundhu.application.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;

@ExtendWith(MockitoExtension.class)
class BusScheduleServiceContinuingBusesTest {

  @Mock
  private BusRepository busRepository;

  @Mock
  private LocationRepository locationRepository;

  @InjectMocks
  private BusScheduleServiceImpl busScheduleService;

  private Location chennaiLocation;
  private Location trichyLocation;
  private Location maduraiLocation;
  private Bus continuingBus1;
  private Bus continuingBus2;

  @BeforeEach
  void setUp() {
    // Setup test locations
    chennaiLocation = new Location(
        new Location.LocationId(1L),
        "Chennai",
        13.0827,
        80.2707);

    trichyLocation = new Location(
        new Location.LocationId(2L),
        "Trichy",
        10.7905,
        78.7047);

    maduraiLocation = new Location(
        new Location.LocationId(3L),
        "Madurai",
        9.9252,
        78.1198);

    // Setup test buses that continue beyond destination
    continuingBus1 = new Bus(
        new Bus.BusId(1L),
        "Express 101",
        "TN-01-1234",
        chennaiLocation,
        maduraiLocation, // Final destination
        LocalTime.of(8, 0),
        LocalTime.of(14, 0),
        50,
        "Express",
        true);

    continuingBus2 = new Bus(
        new Bus.BusId(2L),
        "Super Deluxe 202",
        "TN-02-5678",
        chennaiLocation,
        new Location(new Location.LocationId(4L), "Virudhunagar", 9.5810, 77.9624), // Final destination
        LocalTime.of(10, 30),
        LocalTime.of(17, 30),
        45,
        "Deluxe",
        true);
  }

  @Test
  void testFindBusesContinuingBeyondDestination_Success() {
    // Arrange
    List<Bus> mockBuses = Arrays.asList(continuingBus1, continuingBus2);
    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(mockBuses);
    when(locationRepository.findById(new Location.LocationId(2L)))
        .thenReturn(Optional.of(trichyLocation));

    // Act
    List<BusDTO> result = busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);

    // Assert
    assertNotNull(result);
    assertEquals(2, result.size());

    BusDTO firstBus = result.get(0);
    assertEquals(1L, firstBus.id());
    assertTrue(firstBus.name().contains("(via Trichy)"));
    assertEquals("Chennai", firstBus.fromLocationName());
    assertEquals("Madurai", firstBus.toLocationName());
    assertEquals(LocalTime.of(8, 0), firstBus.departureTime());
    assertEquals(LocalTime.of(14, 0), firstBus.arrivalTime());

    BusDTO secondBus = result.get(1);
    assertEquals(2L, secondBus.id());
    assertTrue(secondBus.name().contains("(via Trichy)"));
    assertEquals("Chennai", secondBus.fromLocationName());
    assertEquals("Virudhunagar", secondBus.toLocationName());

    verify(busRepository).findBusesContinuingBeyondDestination(1L, 2L);
    // The method calls findById multiple times (once for each bus result to get
    // location name)
    verify(locationRepository, atLeast(1)).findById(new Location.LocationId(2L));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_EmptyResult() {
    // Arrange
    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(Arrays.asList());

    // Act
    List<BusDTO> result = busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);

    // Assert
    assertNotNull(result);
    assertTrue(result.isEmpty());

    verify(busRepository).findBusesContinuingBeyondDestination(1L, 2L);
    // No location lookup needed when there are no buses
    verify(locationRepository, never()).findById(any(Location.LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_LocationNotFound() {
    // Arrange
    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(Arrays.asList());

    // Act
    List<BusDTO> result = busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);

    // Assert
    assertNotNull(result);
    assertTrue(result.isEmpty());

    verify(busRepository).findBusesContinuingBeyondDestination(1L, 2L);
    // No location lookup needed when there are no buses
    verify(locationRepository, never()).findById(any(Location.LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_RepositoryException() {
    // Arrange
    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenThrow(new RuntimeException("Database error"));

    // Act & Assert
    assertThrows(RuntimeException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);
    });

    verify(busRepository).findBusesContinuingBeyondDestination(1L, 2L);
    // No location lookup should happen if repository throws exception
    verify(locationRepository, never()).findById(any(Location.LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_NullIds() {
    // Act & Assert
    assertThrows(IllegalArgumentException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(null, 2L);
    });

    assertThrows(IllegalArgumentException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(1L, null);
    });

    verify(busRepository, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
    verify(locationRepository, never()).findById(any(Location.LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_SameFromAndToLocation() {
    // Act & Assert
    assertThrows(IllegalArgumentException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(1L, 1L);
    });

    verify(busRepository, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
    verify(locationRepository, never()).findById(anyLong());
  }

  @Test
  void testFindBusesContinuingBeyondDestination_VerifyBusNameFormatting() {
    // Arrange
    Bus testBus = new Bus(
        new Bus.BusId(1L),
        "Original Bus Name",
        "TN-01-1234",
        chennaiLocation,
        maduraiLocation,
        LocalTime.of(8, 0),
        LocalTime.of(14, 0),
        50,
        "Express",
        true);

    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(Arrays.asList(testBus));
    when(locationRepository.findById(new Location.LocationId(2L)))
        .thenReturn(Optional.of(trichyLocation));

    // Act
    List<BusDTO> result = busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);

    // Assert
    assertEquals(1, result.size());
    BusDTO resultBus = result.get(0);
    assertEquals("Original Bus Name (via Trichy)", resultBus.name());
    assertEquals("Madurai", resultBus.toLocationName()); // Should show final destination
  }
}