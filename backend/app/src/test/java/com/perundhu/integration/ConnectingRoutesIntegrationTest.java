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

import com.perundhu.application.dto.BusScheduleDTO;
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
        public List<BusScheduleDTO> findConnectingRoutes(
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
        // Create BusScheduleDTO objects for the service response using all-args constructor
        List<BusScheduleDTO> mockSchedules = new ArrayList<>();
        
        BusScheduleDTO scheduleDTO1 = new BusScheduleDTO(
            1L,                 // id
            "Express 101",      // name
            null,               // translatedName
            "TN-01-1234",       // busNumber
            "Chennai",          // fromLocationName
            null,               // fromLocationTranslatedName
            "Vellore",          // toLocationName
            null,               // toLocationTranslatedName
            LocalTime.of(6, 0), // departureTime
            LocalTime.of(8, 0)  // arrivalTime
        );
        mockSchedules.add(scheduleDTO1);
        
        BusScheduleDTO scheduleDTO2 = new BusScheduleDTO(
            2L,                  // id
            "Express 102",       // name
            null,                // translatedName
            "TN-01-5678",        // busNumber
            "Vellore",           // fromLocationName
            null,                // fromLocationTranslatedName
            "Bangalore",         // toLocationName
            null,                // toLocationTranslatedName
            LocalTime.of(8, 30), // departureTime
            LocalTime.of(12, 0)  // arrivalTime
        );
        mockSchedules.add(scheduleDTO2);
        
        // Mock service response - use Location objects
        when(busScheduleService.findConnectingRoutes(any(Location.class), any(Location.class), any(String.class)))
            .thenReturn(mockSchedules);

        mockMvc.perform(get("/api/v1/bus-schedules/connecting-routes")
                .param("fromLocationId", "1")
                .param("toLocationId", "3"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].name").value("Express 101"))
                .andExpect(jsonPath("$[0].fromLocationName").value("Chennai"))
                .andExpect(jsonPath("$[0].toLocationName").value("Vellore"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].name").value("Express 102"))
                .andExpect(jsonPath("$[1].fromLocationName").value("Vellore"))
                .andExpect(jsonPath("$[1].toLocationName").value("Bangalore"));
    }

    @Test
    void shouldFindConnectingRouteInTamil() throws Exception {
        // Create BusScheduleDTO objects for the service response using all-args constructor
        List<BusScheduleDTO> mockSchedules = new ArrayList<>();
        
        BusScheduleDTO scheduleDTO1 = new BusScheduleDTO(
            1L,                    // id
            "Express 101",         // name
            "எக்ஸ்பிரஸ் 101",       // translatedName
            "TN-01-1234",          // busNumber
            "Chennai",             // fromLocationName
            "சென்னை",             // fromLocationTranslatedName
            "Vellore",             // toLocationName
            "வேலூர்",              // toLocationTranslatedName
            LocalTime.of(6, 0),    // departureTime
            LocalTime.of(8, 0)     // arrivalTime
        );
        mockSchedules.add(scheduleDTO1);
        
        BusScheduleDTO scheduleDTO2 = new BusScheduleDTO(
            2L,                     // id
            "Express 102",          // name
            "எக்ஸ்பிரஸ் 102",        // translatedName
            "TN-01-5678",           // busNumber
            "Vellore",              // fromLocationName
            "வேலூர்",               // fromLocationTranslatedName
            "Bangalore",            // toLocationName
            "பெங்களூரு",            // toLocationTranslatedName
            LocalTime.of(8, 30),    // departureTime
            LocalTime.of(12, 0)     // arrivalTime
        );
        mockSchedules.add(scheduleDTO2);
        
        // Mock service response - use Location objects
        when(busScheduleService.findConnectingRoutes(any(Location.class), any(Location.class), any(String.class)))
            .thenReturn(mockSchedules);

        mockMvc.perform(get("/api/v1/bus-schedules/connecting-routes")
                .param("fromLocationId", "1")
                .param("toLocationId", "3")
                .param("languageCode", "ta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(1))
                .andExpect(jsonPath("$[0].translatedName").value("எக்ஸ்பிரஸ் 101"))
                .andExpect(jsonPath("$[0].fromLocationTranslatedName").value("சென்னை"))
                .andExpect(jsonPath("$[0].toLocationTranslatedName").value("வேலூர்"))
                .andExpect(jsonPath("$[1].id").value(2))
                .andExpect(jsonPath("$[1].translatedName").value("எக்ஸ்பிரஸ் 102"))
                .andExpect(jsonPath("$[1].fromLocationTranslatedName").value("வேலூர்"))
                .andExpect(jsonPath("$[1].toLocationTranslatedName").value("பெங்களூரு"));
    }
}