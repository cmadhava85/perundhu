package com.perundhu.infrastructure.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;

/**
 * Integration test for BusRepository focusing only on persistence layer
 * without loading full application context
 */
@DataJpaTest
@Import({ BusJpaRepositoryAdapter.class })
@ActiveProfiles("test")
public class BusRepositoryIntegrationTest {

    @Autowired
    private BusRepository busRepository;

    @Autowired
    private BusJpaRepository busJpaRepository;

    @Autowired
    private LocationJpaRepository locationJpaRepository;

    private Location chennai;
    private Location bangalore;
    private Bus expressBus;

    @BeforeEach
    void setUp() {
        // Clear the database before each test
        busJpaRepository.deleteAll();
        locationJpaRepository.deleteAll();

        // Create and save test location entities
        LocationJpaEntity chennaiEntity = new LocationJpaEntity();
        chennaiEntity.setName("Chennai");
        chennaiEntity.setLatitude(13.0827);
        chennaiEntity.setLongitude(80.2707);
        chennaiEntity = locationJpaRepository.save(chennaiEntity);

        LocationJpaEntity bangaloreEntity = new LocationJpaEntity();
        bangaloreEntity.setName("Bangalore");
        bangaloreEntity.setLatitude(12.9716);
        bangaloreEntity.setLongitude(77.5946);
        bangaloreEntity = locationJpaRepository.save(bangaloreEntity);

        // Create domain model locations with the actual IDs assigned by the database
        chennai = new Location(new LocationId(chennaiEntity.getId()), "Chennai", "சென்னை", 13.0827, 80.2707);
        bangalore = new Location(new LocationId(bangaloreEntity.getId()), "Bangalore", "ಬೆಂಗಳೂರು", 12.9716, 77.5946);

        // Create and save bus entities
        BusJpaEntity expressBusEntity = new BusJpaEntity();
        expressBusEntity.setName("Express 101");
        expressBusEntity.setBusNumber("TN-01-1234");
        expressBusEntity.setFromLocation(chennaiEntity);
        expressBusEntity.setToLocation(bangaloreEntity);
        expressBusEntity.setDepartureTime(LocalTime.of(8, 0));
        expressBusEntity.setArrivalTime(LocalTime.of(14, 0));
        expressBusEntity = busJpaRepository.save(expressBusEntity);

        // Create domain models for comparison with assigned IDs
        expressBus = new Bus(
                BusId.of(expressBusEntity.getId()),
                "TN-01-1234",
                "Express 101",
                "State Transport",
                "Express",
                chennai,
                bangalore,
                LocalTime.of(8, 0),
                LocalTime.of(14, 0),
                50,
                Arrays.asList("AC", "WiFi"));
    }

    @Test
    void testFindById() {
        // Test finding a bus by ID
        Optional<Bus> foundExpress = busRepository.findById(expressBus.getId());

        // Assert that the bus is found
        assertTrue(foundExpress.isPresent());
        assertEquals(expressBus.getId(), foundExpress.get().getId());
        assertEquals(expressBus.getName(), foundExpress.get().getName());
        assertEquals(expressBus.getBusNumber(), foundExpress.get().getBusNumber());
        assertEquals(expressBus.getFromLocation().getId(), foundExpress.get().getFromLocation().getId());
        assertEquals(expressBus.getToLocation().getId(), foundExpress.get().getToLocation().getId());
        assertEquals(expressBus.getDepartureTime(), foundExpress.get().getDepartureTime());
        assertEquals(expressBus.getArrivalTime(), foundExpress.get().getArrivalTime());

        // Test for non-existent ID
        Optional<Bus> notFound = busRepository.findById(BusId.of(9999L));
        assertFalse(notFound.isPresent());
    }
}
