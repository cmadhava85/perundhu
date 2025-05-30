package com.perundhu.domain.service;

import java.time.LocalTime;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;

class ConnectingRouteServiceTest {
    
    private ConnectingRouteService service;
    private Location chennai;
    private Location vellore;
    private Location bangalore;
    private Location mysore;
    
    @BeforeEach
    void setUp() {
        service = new ConnectingRouteService();
        
        // Create test locations
        chennai = new Location(new Location.LocationId(1L), "Chennai", 13.0827, 80.2707);
        vellore = new Location(new Location.LocationId(2L), "Vellore", 12.9165, 79.1325);
        bangalore = new Location(new Location.LocationId(3L), "Bangalore", 12.9716, 77.5946);
        mysore = new Location(new Location.LocationId(4L), "Mysore", 12.2958, 76.6394);
    }
    
    @Test
    void shouldFindDirectRoute() {
        // Create a direct bus from Chennai to Bangalore with all required parameters
        Bus directBus = new Bus(
            new Bus.BusId(1L),
            "Express 101",
            "TN-01-1234",
            chennai,
            bangalore,
            LocalTime.of(6, 0),
            LocalTime.of(12, 0)
        );
        
        List<List<Bus>> routes = service.findConnectingRoutes(List.of(directBus), chennai, bangalore);
        
        assertEquals(1, routes.size());
        assertEquals(1, routes.get(0).size());
        assertEquals(directBus, routes.get(0).get(0));
    }
    
    @Test
    void shouldFindRouteWithOneConnection() {
        // Create two connecting buses: Chennai -> Vellore -> Bangalore
        Bus bus1 = new Bus(
            new Bus.BusId(1L),
            "Express 101",
            "TN-01-1234",
            chennai,
            vellore,
            LocalTime.of(6, 0),
            LocalTime.of(8, 0)
        );
        
        Bus bus2 = new Bus(
            new Bus.BusId(2L),
            "Express 102",
            "TN-01-5678",
            vellore,
            bangalore,
            LocalTime.of(8, 30), // 30 minutes connection time
            LocalTime.of(12, 0)
        );
        
        List<List<Bus>> routes = service.findConnectingRoutes(List.of(bus1, bus2), chennai, bangalore);
        
        assertEquals(1, routes.size());
        assertEquals(2, routes.get(0).size());
        assertEquals(bus1, routes.get(0).get(0));
        assertEquals(bus2, routes.get(0).get(1));
    }
    
    @Test
    void shouldNotFindRouteWithInvalidConnectionTime() {
        // Create two buses with insufficient connection time
        Bus bus1 = new Bus(
            new Bus.BusId(1L),
            "Express 101",
            "TN-01-1234",
            chennai,
            vellore,
            LocalTime.of(6, 0),
            LocalTime.of(8, 0)
        );
        
        Bus bus2 = new Bus(
            new Bus.BusId(2L),
            "Express 102",
            "TN-01-5678",
            vellore,
            bangalore,
            LocalTime.of(8, 5), // Only 5 minutes connection time
            LocalTime.of(12, 0)
        );
        
        List<List<Bus>> routes = service.findConnectingRoutes(List.of(bus1, bus2), chennai, bangalore);
        
        assertTrue(routes.isEmpty());
    }
    
    @Test
    void shouldFindRouteWithTwoConnections() {
        // Create three connecting buses: Chennai -> Vellore -> Bangalore -> Mysore
        Bus bus1 = new Bus(
            new Bus.BusId(1L),
            "Express 101",
            "TN-01-1234",
            chennai,
            vellore,
            LocalTime.of(6, 0),
            LocalTime.of(8, 0)
        );
        
        Bus bus2 = new Bus(
            new Bus.BusId(2L),
            "Express 102",
            "TN-01-5678",
            vellore,
            bangalore,
            LocalTime.of(8, 30),
            LocalTime.of(12, 0)
        );
        
        Bus bus3 = new Bus(
            new Bus.BusId(3L),
            "Express 103",
            "KA-01-9012",
            bangalore,
            mysore,
            LocalTime.of(12, 30),
            LocalTime.of(14, 30)
        );
        
        List<List<Bus>> routes = service.findConnectingRoutes(
            List.of(bus1, bus2, bus3), chennai, mysore);
        
        assertEquals(1, routes.size());
        assertEquals(3, routes.get(0).size());
        assertEquals(bus1, routes.get(0).get(0));
        assertEquals(bus2, routes.get(0).get(1));
        assertEquals(bus3, routes.get(0).get(2));
    }
}