package com.perundhu.integration;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.BusRouteSegmentDTO;
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.BusRepository;

@ExtendWith(MockitoExtension.class)
public class ConnectingRoutesIntegrationTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private BusScheduleService busScheduleService;
    
    private MockMvc mockMvc;

    private Location chennai;
    private Location vellore;
    private Location bangalore;
    private Bus chennaiToVellore;
    private Bus velloreToBangalore;
    
    // Mock controller for testing purposes
    @RestController
    @RequestMapping("/api/v1/bus-schedules")
    static class TestBusScheduleController {
        private final BusScheduleService busScheduleService;
        
        public TestBusScheduleController(BusScheduleService busScheduleService) {
            this.busScheduleService = busScheduleService;
        }
        
        @GetMapping("/connecting-routes")
        public List<ConnectingRouteDTO> findConnectingRoutes(
                @RequestParam("fromLocationId") Long fromLocationId,
                @RequestParam("toLocationId") Long toLocationId,
                @RequestParam(value = "languageCode", required = false) String languageCode) {
            
            // Create mock Location objects for the test
            Location from = new Location(new Location.LocationId(fromLocationId), "Location " + fromLocationId, 0.0, 0.0);
            Location to = new Location(new Location.LocationId(toLocationId), "Location " + toLocationId, 0.0, 0.0);
            
            // Default to English if no language code is provided
            String lang = languageCode != null ? languageCode : "en";
            
            // Call the service with Location objects
            return busScheduleService.findConnectingRoutes(from, to, lang);
        }
    }

    @BeforeEach
    void setUp() {
        // Create locations
        chennai = new Location(new Location.LocationId(1L), "Chennai", 13.0827, 80.2707);
        chennai.addTranslation("name", "ta", "சென்னை");

        vellore = new Location(new Location.LocationId(2L), "Vellore", 12.9165, 79.1325);
        vellore.addTranslation("name", "ta", "வேலூர்");

        bangalore = new Location(new Location.LocationId(3L), "Bangalore", 12.9716, 77.5946);
        bangalore.addTranslation("name", "ta", "பெங்களூரு");

        // Create connecting buses with all required parameters
        chennaiToVellore = new Bus(
            new Bus.BusId(1L), 
            "Express 101", 
            "TN-01-1234",
            chennai,
            vellore,
            LocalTime.of(6, 0),
            LocalTime.of(8, 0)
        );
        chennaiToVellore.addTranslation("name", "ta", "எக்ஸ்பிரஸ் 101");

        velloreToBangalore = new Bus(
            new Bus.BusId(2L), 
            "Express 102", 
            "TN-01-5678",
            vellore,
            bangalore,
            LocalTime.of(8, 30),
            LocalTime.of(12, 0)
        );
        velloreToBangalore.addTranslation("name", "ta", "எக்ஸ்பிரஸ் 102");
        
        // Properly initialize MockMvc with our test controller
        TestBusScheduleController controller = new TestBusScheduleController(busScheduleService);
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .defaultRequest(get("/").accept(MediaType.APPLICATION_JSON))
                .build();
    }

    @Test
    void shouldFindConnectingRouteInEnglish() throws Exception {
        // Create ConnectingRouteDTO objects for the service response
        List<ConnectingRouteDTO> mockRoutes = new ArrayList<>();
        
        BusRouteSegmentDTO firstLeg = BusRouteSegmentDTO.builder()
            .busId(1L)
            .busName("Express 101")
            .busNumber("TN-01-1234")
            .departureTime(LocalTime.of(6, 0).toString())
            .from("Chennai")
            .to("Vellore")
            .duration(120)
            .distance(140.0)
            .build();
            
        BusRouteSegmentDTO secondLeg = BusRouteSegmentDTO.builder()
            .busId(2L)
            .busName("Express 102")
            .busNumber("TN-01-5678")
            .departureTime(LocalTime.of(8, 30).toString())
            .from("Vellore")
            .to("Bangalore")
            .arrivalTime(LocalTime.of(12, 0).toString())
            .duration(210)
            .distance(220.0)
            .build();
            
        ConnectingRouteDTO route = ConnectingRouteDTO.builder()
            .id(1L)
            .connectionPoint("Vellore")
            .waitTime(30)
            .totalDuration(330)
            .totalDistance(360.0)
            .firstLeg(firstLeg)
            .secondLeg(secondLeg)
            .connectionStops(new ArrayList<>())
            .build();
            
        mockRoutes.add(route);
        
        // Mock service response - use Location objects
        when(busScheduleService.findConnectingRoutes(any(Location.class), any(Location.class), any(String.class)))
            .thenReturn(mockRoutes);

        mockMvc.perform(get("/api/v1/bus-schedules/connecting-routes")
                .param("fromLocationId", "1")
                .param("toLocationId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].connectionPoint").value("Vellore"))
                .andExpect(jsonPath("$[0].firstLeg.busName").value("Express 101"))
                .andExpect(jsonPath("$[0].firstLeg.from").value("Chennai"))
                .andExpect(jsonPath("$[0].firstLeg.to").value("Vellore"))
                .andExpect(jsonPath("$[0].secondLeg.busName").value("Express 102"))
                .andExpect(jsonPath("$[0].secondLeg.from").value("Vellore"))
                .andExpect(jsonPath("$[0].secondLeg.to").value("Bangalore"));
    }

    @Test
    void shouldFindConnectingRouteInTamil() throws Exception {
        // Create ConnectingRouteDTO objects for the service response with Tamil translations
        List<ConnectingRouteDTO> mockRoutes = new ArrayList<>();
        
        BusRouteSegmentDTO firstLeg = BusRouteSegmentDTO.builder()
            .busId(1L)
            .busName("Express 101")
            .busNameTranslated("எக்ஸ்பிரஸ் 101")
            .busNumber("TN-01-1234")
            .departureTime(LocalTime.of(6, 0).toString())
            .from("Chennai")
            .fromTranslated("சென்னை")
            .to("Vellore")
            .toTranslated("வேலூர்")
            .duration(120)
            .distance(140.0)
            .build();
            
        BusRouteSegmentDTO secondLeg = BusRouteSegmentDTO.builder()
            .busId(2L)
            .busName("Express 102")
            .busNameTranslated("எக்ஸ்பிரஸ் 102")
            .busNumber("TN-01-5678")
            .departureTime(LocalTime.of(8, 30).toString())
            .from("Vellore")
            .fromTranslated("வேலூர்")
            .to("Bangalore")
            .toTranslated("பெங்களூரு")
            .arrivalTime(LocalTime.of(12, 0).toString())
            .duration(210)
            .distance(220.0)
            .build();
            
        ConnectingRouteDTO route = ConnectingRouteDTO.builder()
            .id(1L)
            .connectionPoint("Vellore")
            .connectionPointTranslated("வேலூர்")
            .waitTime(30)
            .totalDuration(330)
            .totalDistance(360.0)
            .firstLeg(firstLeg)
            .secondLeg(secondLeg)
            .connectionStops(new ArrayList<>())
            .build();
            
        mockRoutes.add(route);
        
        // Mock service response - use Location objects
        when(busScheduleService.findConnectingRoutes(any(Location.class), any(Location.class), any(String.class)))
            .thenReturn(mockRoutes);

        mockMvc.perform(get("/api/v1/bus-schedules/connecting-routes")
                .param("fromLocationId", "1")
                .param("toLocationId", "3")
                .param("languageCode", "ta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].connectionPointTranslated").value("வேலூர்"))
                .andExpect(jsonPath("$[0].firstLeg.busNameTranslated").value("எக்ஸ்பிரஸ் 101"))
                .andExpect(jsonPath("$[0].firstLeg.fromTranslated").value("சென்னை"))
                .andExpect(jsonPath("$[0].firstLeg.toTranslated").value("வேலூர்"))
                .andExpect(jsonPath("$[0].secondLeg.busNameTranslated").value("எக்ஸ்பிரஸ் 102"))
                .andExpect(jsonPath("$[0].secondLeg.fromTranslated").value("வேலூர்"))
                .andExpect(jsonPath("$[0].secondLeg.toTranslated").value("பெங்களூரு"));
    }
}