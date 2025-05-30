package com.perundhu.repository;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.infrastructure.persistence.LocationJpaRepositoryAdapter;

/**
 * Basic repository tests for the hexagonal architecture.
 * Tests basic CRUD operations on Location repository.
 */
@DataJpaTest
@ActiveProfiles("test")
@Transactional
@Tag("hexagonal")
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.flyway.enabled=false"
})
@Import({LocationJpaRepositoryAdapter.class})
public class BasicRepositoryTest {
    
    @Autowired
    private LocationRepository locationRepository;
    
    @Test
    void testFindById() {
        // Create a new location first
        Location newLocation = new Location(
            null, // ID will be generated
            "Chennai",
            13.0827,
            80.2707
        );
        
        // Save the location
        Location savedLocation = locationRepository.save(newLocation);
        assertNotNull(savedLocation.getId(), "Saved location should have an ID");
        
        // Retrieve the location by ID (use LocationId)
        Optional<Location> location = locationRepository.findById(savedLocation.getId());
        
        // Assert
        assertTrue(location.isPresent(), "Location should be found");
        assertEquals(savedLocation.getId().getValue(), location.get().getId().getValue(), "Location ID should match");
        assertEquals("Chennai", location.get().getName(), "Location name should match");
    }
    
    @Test
    void testFindAll() {
        // Create and save a test location
        Location location = new Location(
            null,
            "Chennai",
            13.0827,
            80.2707
        );
        locationRepository.save(location);
        
        // Retrieve all locations
        List<Location> locations = locationRepository.findAll();
        
        // Assert
        assertFalse(locations.isEmpty(), "Locations list should not be empty");
        assertTrue(locations.size() >= 1, "Should have at least one location");
    }
    
    @Test
    void testSaveAndDelete() {
        // Create a new location
        Location newLocation = new Location(
            null, // ID will be generated
            "Test Location",
            12.9716,
            77.5946
        );
        
        // Save
        Location savedLocation = locationRepository.save(newLocation);
        
        // Assert save
        assertNotNull(savedLocation.getId(), "Saved location should have an ID");
        
        // Retrieve to verify (use LocationId)
        Optional<Location> retrieved = locationRepository.findById(savedLocation.getId());
        assertTrue(retrieved.isPresent(), "Should be able to retrieve the saved location");
        assertEquals("Test Location", retrieved.get().getName(), "Name should match");
        
        // Delete - use the ID
        locationRepository.delete(savedLocation.getId());
        
        // Verify deleted
        Optional<Location> afterDelete = locationRepository.findById(savedLocation.getId());
        assertFalse(afterDelete.isPresent(), "Location should be deleted");
    }
    
    @Test
    void testFindByName() {
        // Create and save a location with a specific name
        Location location = new Location(
            null,
            "Chennai",
            13.0827,
            80.2707
        );
        locationRepository.save(location);
        
        // Find a location by name
        List<Location> locations = locationRepository.findByName("Chennai");
        
        // Assert
        assertFalse(locations.isEmpty(), "Should find at least one location");
        assertEquals("Chennai", locations.get(0).getName(), "Name should match");
    }
}