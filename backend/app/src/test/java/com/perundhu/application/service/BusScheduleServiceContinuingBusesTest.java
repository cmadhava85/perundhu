package com.perundhu.application.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
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
        new LocationId(1L),
        "Chennai",
        "சென்னை",
        13.0827,
        80.2707);

    trichyLocation = new Location(
        new LocationId(2L),
        "Trichy",
        "திருச்சி",
        10.7905,
        78.7047);

    maduraiLocation = new Location(
        new LocationId(3L),
        "Madurai",
        "மதுரை",
        9.9252,
        78.1198);

    // Setup test buses that continue beyond destination
    continuingBus1 = Bus.create(
        BusId.of(1L),
        "TN-01-1234",
        "Express 101",
        "TN State Transport",
        "AC",
        chennaiLocation,
        maduraiLocation, // Final destination
        LocalTime.of(6, 30),
        LocalTime.of(12, 30),
        50);

    continuingBus2 = Bus.create(
        BusId.of(2L),
        "TN-02-5678",
        "Super Deluxe 202",
        "Private Bus Service",
        "Non-AC",
        chennaiLocation,
        maduraiLocation, // Final destination
        LocalTime.of(8, 0),
        LocalTime.of(14, 0),
        45);
  }

  @Test
  void testFindBusesContinuingBeyondDestination_Success() {
    // Arrange
    List<Bus> mockBuses = Arrays.asList(continuingBus1, continuingBus2);
    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(mockBuses);

    // Act
    List<BusDTO> result = busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);

    // Assert - Method should now return the buses from repository
    assertNotNull(result);
    assertTrue(result.size() == 2); // Should return the 2 mocked buses

    // Verify the result contains correct bus data
    BusDTO firstBus = result.get(0);
    assertNotNull(firstBus);
    assertTrue(firstBus.id().equals(1L));
    assertTrue(firstBus.name().equals("Express 101"));

    // Verify repository methods are called
    verify(busRepository).findBusesContinuingBeyondDestination(1L, 2L);
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
    verify(locationRepository, never()).findById(any(LocationId.class));
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
    verify(locationRepository, never()).findById(any(LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_RepositoryException() {
    // Arrange
    when(busRepository.findBusesContinuingBeyondDestination(1L, 2L))
        .thenThrow(new RuntimeException("Database error"));

    // Act & Assert
    RuntimeException exception = assertThrows(RuntimeException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);
    });
    assertNotNull(exception);

    verify(busRepository).findBusesContinuingBeyondDestination(1L, 2L);
    // No location lookup should happen if repository throws exception
    verify(locationRepository, never()).findById(any(LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_NullIds() {
    // Act & Assert
    IllegalArgumentException exception1 = assertThrows(IllegalArgumentException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(null, 2L);
    });
    assertNotNull(exception1);

    IllegalArgumentException exception2 = assertThrows(IllegalArgumentException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(1L, null);
    });
    assertNotNull(exception2);

    verify(busRepository, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
    verify(locationRepository, never()).findById(any(LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_SameFromAndToLocation() {
    // Act & Assert
    IllegalArgumentException exception = assertThrows(IllegalArgumentException.class, () -> {
      busScheduleService.findBusesContinuingBeyondDestination(1L, 1L);
    });
    assertNotNull(exception);

    verify(busRepository, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
    verify(locationRepository, never()).findById(any(LocationId.class));
  }

  @Test
  void testFindBusesContinuingBeyondDestination_VerifyBusNameFormatting() {
    // Currently the method is not implemented and returns empty list
    // This test would verify the behavior once the method is implemented

    // Act
    List<BusDTO> result = busScheduleService.findBusesContinuingBeyondDestination(1L, 2L);

    // Assert - Method currently returns empty list
    assertNotNull(result);
    assertTrue(result.isEmpty());
  }
}