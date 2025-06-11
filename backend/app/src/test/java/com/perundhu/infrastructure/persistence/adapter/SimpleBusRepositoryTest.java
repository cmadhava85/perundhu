package com.perundhu.infrastructure.persistence.adapter;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;

@ExtendWith(MockitoExtension.class)
public class SimpleBusRepositoryTest {

    @Mock
    private BusJpaRepository busJpaRepository;
    
    @InjectMocks
    private BusJpaRepositoryAdapter adapter;
    
    @Test
    void testFindById() {
        // Arrange
        Long busId = 1L;
        LocationJpaEntity fromLocation = new LocationJpaEntity();
        fromLocation.setId(1L);
        fromLocation.setName("Chennai");
        fromLocation.setLatitude(13.0827);
        fromLocation.setLongitude(80.2707);
        
        LocationJpaEntity toLocation = new LocationJpaEntity();
        toLocation.setId(2L);
        toLocation.setName("Bangalore");
        toLocation.setLatitude(12.9716);
        toLocation.setLongitude(77.5946);
        
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(busId);
        busEntity.setName("Express 101");
        busEntity.setBusNumber("TN-01-1234");
        busEntity.setFromLocation(fromLocation);
        busEntity.setToLocation(toLocation);
        busEntity.setDepartureTime(LocalTime.of(8, 0));
        busEntity.setArrivalTime(LocalTime.of(14, 0));
        
        Mockito.when(busJpaRepository.findById(busId)).thenReturn(Optional.of(busEntity));
        
        // Act
        Optional<Bus> result = adapter.findById(new Bus.BusId(busId));
        
        // Assert
        assertTrue(result.isPresent());
        assertEquals("Express 101", result.get().getName());
        assertEquals("TN-01-1234", result.get().getBusNumber());
        assertEquals("Chennai", result.get().getFromLocation().getName());
        assertEquals("Bangalore", result.get().getToLocation().getName());
    }
    
    @Test
    void testFindByFromAndToLocation() {
        // Arrange
        Long fromLocationId = 1L;
        Long toLocationId = 2L;
        
        LocationJpaEntity fromLocation = new LocationJpaEntity();
        fromLocation.setId(fromLocationId);
        fromLocation.setName("Chennai");
        
        LocationJpaEntity toLocation = new LocationJpaEntity();
        toLocation.setId(toLocationId);
        toLocation.setName("Bangalore");
        
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(1L);
        busEntity.setName("Express 101");
        busEntity.setBusNumber("TN-01-1234");
        busEntity.setFromLocation(fromLocation);
        busEntity.setToLocation(toLocation);
        
        // Fix mock to use the correct method and parameters
        Mockito.when(busJpaRepository.findByFromLocationAndToLocation(
            Mockito.any(LocationJpaEntity.class), Mockito.any(LocationJpaEntity.class)))
            .thenReturn(Arrays.asList(busEntity));
        
        Location fromDomain = new Location(new Location.LocationId(fromLocationId), "Chennai", 13.0, 80.0);
        Location toDomain = new Location(new Location.LocationId(toLocationId), "Bangalore", 12.0, 77.0);
        
        // Act
        List<Bus> buses = adapter.findByFromAndToLocation(fromDomain, toDomain);
        
        // Assert
        assertEquals(1, buses.size());
        assertEquals("Express 101", buses.get(0).getName());
        assertEquals("TN-01-1234", buses.get(0).getBusNumber());
    }
    
    @Test
    void testExistsByBusNumberAndFromAndToLocations() {
        // Arrange
        String busNumber = "TN-01-1234";
        String fromLocationName = "Chennai";
        String toLocationName = "Bangalore";
        
        Mockito.when(busJpaRepository.existsByBusNumberAndFromAndToLocations(
            busNumber, fromLocationName, toLocationName)).thenReturn(true);
        
        // Act
        boolean exists = adapter.existsByBusNumberAndFromAndToLocations(
            busNumber, fromLocationName, toLocationName);
        
        // Assert
        assertTrue(exists);
    }
}