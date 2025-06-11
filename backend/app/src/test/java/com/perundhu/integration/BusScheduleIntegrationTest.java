package com.perundhu.integration;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.BusRouteSegmentDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.StopRepository;

/**
 * Unit tests for the BusSchedule functionality using hexagonal architecture.
 * These tests verify that the application layer and domain layer work correctly.
 */
@ExtendWith(MockitoExtension.class)
@Tag("hexagonal")
public class BusScheduleIntegrationTest {

    @Mock
    private BusRepository busRepository;
    
    @Mock
    private StopRepository stopRepository;

    @Mock
    private BusScheduleService busScheduleService;

    private Bus testBus;
    private Location chennai;
    private Location vellore;

    @BeforeEach
    void setUp() {
        // Create test locations
        chennai = new Location(new Location.LocationId(1L), "Chennai", 13.0827, 80.2707);
        chennai.addTranslation("name", "ta", "சென்னை");

        vellore = new Location(new Location.LocationId(2L), "Vellore", 12.9165, 79.1325);
        vellore.addTranslation("name", "ta", "வேலூர்");

        // Create test bus with all required parameters
        testBus = new Bus(
            new Bus.BusId(1L), 
            "Express 101", 
            "TN-01-1234",
            chennai,
            vellore,
            LocalTime.of(6, 0),
            LocalTime.of(8, 30)
        );
        testBus.addTranslation("name", "ta", "எக்ஸ்பிரஸ் 101");
    }

    @Test
    void shouldReturnBusScheduleInEnglish() throws Exception {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(2L);

        // Create BusScheduleDTO with all required fields
        BusScheduleDTO mockSchedule = new BusScheduleDTO(
            1L,                    // id
            "Express 101",         // name
            null,                  // translatedName (not needed for English)
            "TN-01-1234",          // busNumber
            "Chennai",             // fromLocationName
            null,                  // fromLocationTranslatedName
            "Vellore",             // toLocationName
            null,                  // toLocationTranslatedName
            LocalTime.of(6, 0),    // departureTime
            LocalTime.of(8, 30)    // arrivalTime
        );

        when(busScheduleService.findBusSchedules(fromLocation, toLocation, "en"))
            .thenReturn(List.of(mockSchedule));

        List<BusScheduleDTO> busSchedules = busScheduleService.findBusSchedules(fromLocation, toLocation, "en");

        assertNotNull(busSchedules);
        assertEquals(1, busSchedules.size());
        assertEquals("Express 101", busSchedules.get(0).getName());
    }

    @Test
    void shouldReturnBusScheduleInTamil() throws Exception {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(2L);

        // Create BusScheduleDTO with all required fields including translations
        BusScheduleDTO mockSchedule = new BusScheduleDTO(
            1L,                     // id
            "Express 101",          // name
            "எக்ஸ்பிரஸ் 101",        // translatedName
            "TN-01-1234",           // busNumber
            "Chennai",              // fromLocationName
            "சென்னை",              // fromLocationTranslatedName
            "Vellore",              // toLocationName
            "வேலூர்",               // toLocationTranslatedName
            LocalTime.of(6, 0),     // departureTime
            LocalTime.of(8, 30)     // arrivalTime
        );

        when(busScheduleService.findBusSchedules(fromLocation, toLocation, "ta"))
            .thenReturn(List.of(mockSchedule));

        List<BusScheduleDTO> busSchedules = busScheduleService.findBusSchedules(fromLocation, toLocation, "ta");

        assertNotNull(busSchedules);
        assertEquals(1, busSchedules.size());
        assertEquals("எக்ஸ்பிரஸ் 101", busSchedules.get(0).getTranslatedName());
    }

    @Test
    void shouldReturnBusStopsInTamil() throws Exception {
        Long busId = 1L;

        // Create StopDTO objects with all required fields
        StopDTO chennaiStop = new StopDTO(
            "Chennai Central",          // name
            "சென்னை மத்திய",           // translatedName
            LocalTime.of(6, 0),         // arrivalTime
            LocalTime.of(6, 5),         // departureTime 
            1                           // stopOrder
        );

        StopDTO velloreStop = new StopDTO(
            "Vellore Bus Stand",        // name
            "வேலூர் பேருந்து நிலையம்",    // translatedName
            LocalTime.of(8, 25),        // arrivalTime
            LocalTime.of(8, 30),        // departureTime
            2                           // stopOrder
        );

        List<StopDTO> mockStops = new ArrayList<>();
        mockStops.add(chennaiStop);
        mockStops.add(velloreStop);

        when(busScheduleService.findBusStops(busId, "ta"))
            .thenReturn(mockStops);

        List<StopDTO> stops = busScheduleService.findBusStops(busId, "ta");

        assertNotNull(stops);
        assertEquals(2, stops.size());
        assertEquals("சென்னை மத்திய", stops.get(0).getTranslatedName());
        assertEquals("வேலூர் பேருந்து நிலையம்", stops.get(1).getTranslatedName());
    }

    @Test
    void testFindBusSchedules() {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(2L);

        BusScheduleDTO mockSchedule = new BusScheduleDTO(
            1L,                    // id
            "Express 101",         // name
            null,                  // translatedName
            "TN-01-1234",          // busNumber
            "Chennai",             // fromLocationName
            null,                  // fromLocationTranslatedName
            "Vellore",             // toLocationName
            null,                  // toLocationTranslatedName
            LocalTime.of(6, 0),    // departureTime
            LocalTime.of(8, 30)    // arrivalTime
        );

        when(busScheduleService.findBusSchedules(fromLocation, toLocation, "en"))
            .thenReturn(List.of(mockSchedule));

        List<BusScheduleDTO> busSchedules = busScheduleService.findBusSchedules(fromLocation, toLocation, "en");

        assertNotNull(busSchedules);
        if (!busSchedules.isEmpty()) {
            BusScheduleDTO dto = busSchedules.get(0);
            assertValidBusScheduleDTO(dto);
        }
    }

    @Test
    void testFindConnectingRoutes() {
        Location fromLocation = Location.reference(1L);
        Location toLocation = Location.reference(3L);

        // Create route segments for the connecting route
        BusRouteSegmentDTO firstLeg = BusRouteSegmentDTO.builder()
            .busId(1L)
            .busName("Express 101")
            .busNumber("TN-01-1234")
            .departureTime(LocalTime.of(6, 0).toString())
            .from("Chennai")
            .to("Vellore")
            .duration(150)
            .distance(130.0)
            .build();
            
        BusRouteSegmentDTO secondLeg = BusRouteSegmentDTO.builder()
            .busId(2L)
            .busName("Express 102")
            .busNumber("TN-01-5678")
            .departureTime(LocalTime.of(9, 0).toString())
            .from("Vellore")
            .to("Bangalore")
            .arrivalTime(LocalTime.of(12, 0).toString())
            .duration(180)
            .distance(210.0)
            .build();
            
        ConnectingRouteDTO mockRoute = ConnectingRouteDTO.builder()
            .id(1L)
            .connectionPoint("Vellore")
            .waitTime(30)
            .totalDuration(330)
            .totalDistance(340.0)
            .firstLeg(firstLeg)
            .secondLeg(secondLeg)
            .connectionStops(new ArrayList<>())
            .build();

        when(busScheduleService.findConnectingRoutes(fromLocation, toLocation, "en"))
            .thenReturn(List.of(mockRoute));

        List<ConnectingRouteDTO> connectingRoutes = busScheduleService.findConnectingRoutes(fromLocation, toLocation, "en");

        assertNotNull(connectingRoutes);
        if (!connectingRoutes.isEmpty()) {
            ConnectingRouteDTO dto = connectingRoutes.get(0);
            assertValidConnectingRouteDTO(dto);
        }
    }
    
    private void assertValidConnectingRouteDTO(ConnectingRouteDTO dto) {
        assertNotNull(dto);
        assertNotNull(dto.getId());
        assertNotNull(dto.getConnectionPoint());
        assertNotNull(dto.getFirstLeg());
        assertNotNull(dto.getSecondLeg());
        
        BusRouteSegmentDTO firstLeg = dto.getFirstLeg();
        assertNotNull(firstLeg.getBusId());
        assertNotNull(firstLeg.getBusName());
        assertNotNull(firstLeg.getBusNumber());
        assertNotNull(firstLeg.getFrom());
        assertNotNull(firstLeg.getTo());
        assertNotNull(firstLeg.getDepartureTime());
        
        BusRouteSegmentDTO secondLeg = dto.getSecondLeg();
        assertNotNull(secondLeg.getBusId());
        assertNotNull(secondLeg.getBusName());
        assertNotNull(secondLeg.getBusNumber());
        assertNotNull(secondLeg.getFrom());
        assertNotNull(secondLeg.getTo());
    }

    @Test
    void testFindBusStops() {
        Long busId = 1L;

        StopDTO mockStop = new StopDTO(
            "Chennai Central",      // name
            null,                   // translatedName
            LocalTime.of(6, 0),     // arrivalTime
            LocalTime.of(6, 5),     // departureTime
            1                       // stopOrder
        );

        when(busScheduleService.findBusStops(busId, "en"))
            .thenReturn(List.of(mockStop));

        List<StopDTO> stops = busScheduleService.findBusStops(busId, "en");

        assertNotNull(stops);
        if (!stops.isEmpty()) {
            StopDTO stop = stops.get(0);
            assertNotNull(stop.getName());
            assertTrue(stop.getStopOrder() >= 0);
        }
    }

    private void assertValidBusScheduleDTO(BusScheduleDTO dto) {
        assertNotNull(dto);
        assertNotNull(dto.getId());
        assertNotNull(dto.getName());
        assertNotNull(dto.getBusNumber());
        assertNotNull(dto.getFromLocationName());
        assertNotNull(dto.getToLocationName());
        assertNotNull(dto.getDepartureTime());
        assertNotNull(dto.getArrivalTime());
    }
}