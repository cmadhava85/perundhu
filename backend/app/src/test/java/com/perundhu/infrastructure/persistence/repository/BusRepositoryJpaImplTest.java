package com.perundhu.infrastructure.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

/**
 * Unit tests for BusJpaRepositoryAdapter
 */
@ExtendWith(MockitoExtension.class)
public class BusRepositoryJpaImplTest {

    @Mock
    private BusJpaRepository busJpaRepository;

    private BusJpaRepositoryAdapter busRepository;

    private Bus testBus;
    private BusJpaEntity testBusEntity;
    private Location fromLocation;
    private Location toLocation;
    private LocationJpaEntity fromLocationEntity;
    private LocationJpaEntity toLocationEntity;

    @BeforeEach
    void setUp() {
        busRepository = new BusJpaRepositoryAdapter(busJpaRepository);

        // Create test locations
        fromLocation = new Location(new LocationId(1L), "Chennai", "சென்னை", 13.0827, 80.2707);
        toLocation = new Location(new LocationId(2L), "Bangalore", "ಬೆಂಗಳೂರು", 12.9716, 77.5946);

        // Create test bus
        testBus = new Bus(
                BusId.of(1L),
                "TN-01-1234",
                "Express 101",
                "Test Operator",
                "Express",
                fromLocation,
                toLocation,
                LocalTime.of(9, 0),
                LocalTime.of(15, 0),
                50,
                Arrays.asList("AC", "WiFi"));

        // Create JPA entities
        fromLocationEntity = new LocationJpaEntity();
        fromLocationEntity.setId(fromLocation.getId().getValue());
        fromLocationEntity.setName(fromLocation.getName());
        fromLocationEntity.setLatitude(fromLocation.getLatitude());
        fromLocationEntity.setLongitude(fromLocation.getLongitude());

        toLocationEntity = new LocationJpaEntity();
        toLocationEntity.setId(toLocation.getId().getValue());
        toLocationEntity.setName(toLocation.getName());
        toLocationEntity.setLatitude(toLocation.getLatitude());
        toLocationEntity.setLongitude(toLocation.getLongitude());

        testBusEntity = new BusJpaEntity();
        testBusEntity.setId(testBus.getId().getValue());
        testBusEntity.setName(testBus.getName());
        testBusEntity.setBusNumber(testBus.getBusNumber());
        testBusEntity.setFromLocation(fromLocationEntity);
        testBusEntity.setToLocation(toLocationEntity);
        testBusEntity.setDepartureTime(testBus.getDepartureTime());
        testBusEntity.setArrivalTime(testBus.getArrivalTime());
    }

    @Test
    void testFindById() {
        // Setup
        when(busJpaRepository.findById(1L)).thenReturn(Optional.of(testBusEntity));

        // Execute
        Optional<Bus> result = busRepository.findById(BusId.of(1L));

        // Verify
        assertTrue(result.isPresent());
        assertEquals("Express 101", result.get().getName());
        assertEquals("TN-01-1234", result.get().getBusNumber());
        assertEquals(fromLocation.getName(), result.get().getFromLocation().getName());
        assertEquals(toLocation.getName(), result.get().getToLocation().getName());
    }

    @Test
    void testFindByFromAndToLocation() {
        // Setup - Mock the method that takes entity objects, not IDs
        List<BusJpaEntity> busEntities = Arrays.asList(testBusEntity);
        when(busJpaRepository.findByFromLocationAndToLocation(any(LocationJpaEntity.class),
                any(LocationJpaEntity.class)))
                .thenReturn(busEntities);

        // Execute
        List<Bus> results = busRepository.findByFromAndToLocation(fromLocation, toLocation);

        // Verify
        assertEquals(1, results.size());
        assertEquals("Express 101", results.get(0).getName());
        assertEquals("TN-01-1234", results.get(0).getBusNumber());
        assertEquals(fromLocation.getName(), results.get(0).getFromLocation().getName());
        assertEquals(toLocation.getName(), results.get(0).getToLocation().getName());

        // Verify the correct method was called with entity parameters
        verify(busJpaRepository).findByFromLocationAndToLocation(any(LocationJpaEntity.class),
                any(LocationJpaEntity.class));
    }

    @Test
    void testFindByFromLocation() {
        // Setup - Use specific location ID instead of anyLong()
        List<BusJpaEntity> busEntities = Arrays.asList(testBusEntity);
        when(busJpaRepository.findByFromLocationId(1L)).thenReturn(busEntities);

        // Execute
        List<Bus> results = busRepository.findByFromLocation(fromLocation);

        // Verify
        assertEquals(1, results.size());
        assertEquals("Express 101", results.get(0).getName());
        assertEquals(fromLocation.getName(), results.get(0).getFromLocation().getName());

        // Verify the correct method was called with the right parameter
        verify(busJpaRepository).findByFromLocationId(1L);
    }

    @Test
    void testSave() {
        // Setup
        when(busJpaRepository.save(any(BusJpaEntity.class))).thenReturn(testBusEntity);

        // Execute
        Bus savedBus = busRepository.save(testBus);

        // Verify
        assertEquals(testBus.getId().getValue(), savedBus.getId().getValue());
        assertEquals(testBus.getName(), savedBus.getName());
        assertEquals(testBus.getBusNumber(), savedBus.getBusNumber());
        verify(busJpaRepository).save(any(BusJpaEntity.class));
    }

    @Test
    void testDelete() {
        // Execute
        busRepository.delete(BusId.of(1L));

        // Verify
        verify(busJpaRepository).deleteById(1L);
    }

    @Test
    void testExistsByBusNumberAndFromAndToLocations() {
        // Setup
        when(busJpaRepository.existsByBusNumberAndFromAndToLocations(
                "TN-01-1234", "Chennai", "Bangalore")).thenReturn(true);

        when(busJpaRepository.existsByBusNumberAndFromAndToLocations(
                "TN-01-9999", "Chennai", "Bangalore")).thenReturn(false);

        // Execute & Verify
        assertTrue(busRepository.existsByBusNumberAndFromAndToLocations(
                "TN-01-1234", "Chennai", "Bangalore"));

        assertFalse(busRepository.existsByBusNumberAndFromAndToLocations(
                "TN-01-9999", "Chennai", "Bangalore"));
    }
}
