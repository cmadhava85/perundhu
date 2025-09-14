package com.perundhu.infrastructure.persistence.repository;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.infrastructure.persistence.adapter.BusJpaRepositoryAdapter;
import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.BusJpaRepository;
import com.perundhu.infrastructure.persistence.jpa.LocationJpaRepository;

@DataJpaTest
@Import({ BusJpaRepositoryAdapter.class })
@ComponentScan(basePackages = {
        "com.perundhu.infrastructure.persistence.jpa",
        "com.perundhu.infrastructure.persistence.entity"
})
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
    private Location vellore;
    private Bus expressBus;
    private Bus localBus;

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

        LocationJpaEntity velloreEntity = new LocationJpaEntity();
        velloreEntity.setName("Vellore");
        velloreEntity.setLatitude(12.9165);
        velloreEntity.setLongitude(79.1325);
        velloreEntity = locationJpaRepository.save(velloreEntity);

        // Create domain model locations with the actual IDs assigned by the database
        chennai = new Location(new Location.LocationId(chennaiEntity.getId()), "Chennai", 13.0827, 80.2707);
        bangalore = new Location(new Location.LocationId(bangaloreEntity.getId()), "Bangalore", 12.9716, 77.5946);
        vellore = new Location(new Location.LocationId(velloreEntity.getId()), "Vellore", 12.9165, 79.1325);

        // Create and save bus entities
        BusJpaEntity expressBusEntity = new BusJpaEntity();
        expressBusEntity.setName("Express 101");
        expressBusEntity.setBusNumber("TN-01-1234");
        expressBusEntity.setFromLocation(chennaiEntity); // Use the actual saved entity
        expressBusEntity.setToLocation(bangaloreEntity); // Use the actual saved entity
        expressBusEntity.setDepartureTime(LocalTime.of(8, 0));
        expressBusEntity.setArrivalTime(LocalTime.of(14, 0));
        expressBusEntity = busJpaRepository.save(expressBusEntity);

        BusJpaEntity localBusEntity = new BusJpaEntity();
        localBusEntity.setName("Local 202");
        localBusEntity.setBusNumber("TN-01-5678");
        localBusEntity.setFromLocation(chennaiEntity); // Use the actual saved entity
        localBusEntity.setToLocation(velloreEntity); // Use the actual saved entity
        localBusEntity.setDepartureTime(LocalTime.of(9, 0));
        localBusEntity.setArrivalTime(LocalTime.of(12, 30));
        localBusEntity = busJpaRepository.save(localBusEntity);

        // Create domain models for comparison with assigned IDs
        expressBus = new Bus(
                new Bus.BusId(expressBusEntity.getId()),
                "Express 101",
                "TN-01-1234",
                chennai,
                bangalore,
                LocalTime.of(8, 0),
                LocalTime.of(14, 0),
                50,
                "Express",
                true);

        localBus = new Bus(
                new Bus.BusId(localBusEntity.getId()),
                "Local 202",
                "TN-01-5678",
                chennai,
                vellore,
                LocalTime.of(9, 0),
                LocalTime.of(12, 30),
                40,
                "Regular",
                true);
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
        Optional<Bus> notFound = busRepository.findById(new Bus.BusId(9999L));
        assertFalse(notFound.isPresent());
    }
}
