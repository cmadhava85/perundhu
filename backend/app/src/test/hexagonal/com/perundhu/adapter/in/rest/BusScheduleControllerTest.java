package com.perundhu.adapter.in.rest;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.dto.BusScheduleDTO;
import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.StopDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.ConnectingRouteService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@Tag("hexagonal")
public class BusScheduleControllerTest {

        private MockMvc mockMvc;

        @Mock
        private BusScheduleService busScheduleService;

        @Mock
        private ConnectingRouteService connectingRouteService;

        @InjectMocks
        private BusScheduleController controller;

        private List<LocationDTO> locations;
        private List<BusScheduleDTO> schedules;
        private List<StopDTO> stops;
        private List<BusDTO> buses;

        @BeforeEach
        void setUp() {
                // Initialize MockMvc
                mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

                // Setup test data
                locations = Arrays.asList(
                                new LocationDTO(1L, "Chennai", 13.0827, 80.2707),
                                new LocationDTO(2L, "Bangalore", 12.9716, 77.5946));

                buses = Arrays.asList(
                                new BusDTO(
                                                1L, // id
                                                "Express", // name
                                                "Express", // translatedName
                                                "BUS001" // busNumber
                                ));

                schedules = Arrays.asList(
                                new BusScheduleDTO(
                                                1L, // id
                                                "Express", // name
                                                "Express", // translatedName
                                                "BUS001", // busNumber
                                                "Chennai", // fromLocationName
                                                "Chennai", // fromLocationTranslatedName
                                                "Bangalore", // toLocationName
                                                "Bangalore", // toLocationTranslatedName
                                                LocalTime.of(8, 0), // departureTime
                                                LocalTime.of(14, 0) // arrivalTime
                                ));

                stops = Arrays.asList(
                                new StopDTO(
                                                1L, // id
                                                "Stop 1", // name
                                                1L, // locationId
                                                LocalTime.of(8, 30), // arrivalTime
                                                LocalTime.of(8, 35), // departureTime
                                                1, // sequence
                                                Map.of(), // features
                                                13.0827, // latitude
                                                80.2707 // longitude
                                ),
                                new StopDTO(
                                                2L, // id
                                                "Stop 2", // name
                                                2L, // locationId
                                                LocalTime.of(10, 30), // arrivalTime
                                                LocalTime.of(10, 35), // departureTime
                                                2, // sequence
                                                Map.of(), // features
                                                12.9716, // latitude
                                                77.5946 // longitude
                                ));

                // Mock service method responses - updated to match actual controller usage
                when(busScheduleService.getAllLocations(anyString()))
                                .thenReturn(locations);

                when(busScheduleService.getAllBuses())
                                .thenReturn(buses);

                when(busScheduleService.getBusById(anyLong()))
                                .thenReturn(Optional.of(buses.get(0)));

                when(busScheduleService.findBusStops(anyLong(), anyString()))
                                .thenReturn(stops);
        }

        @Test
        void testGetAllLocations() throws Exception {
                mockMvc.perform(get("/api/v1/bus-schedules/locations")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].id").value(1))
                                .andExpect(jsonPath("$[0].name").value("Chennai"))
                                .andExpect(jsonPath("$[1].id").value(2))
                                .andExpect(jsonPath("$[1].name").value("Bangalore"));
        }

        @Test
        void testGetAllBuses() throws Exception {
                mockMvc.perform(get("/api/v1/bus-schedules")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].id").value(1))
                                .andExpect(jsonPath("$[0].name").value("Express"))
                                .andExpect(jsonPath("$[0].busNumber").value("BUS001"));
        }

        @Test
        void testGetBusById() throws Exception {
                mockMvc.perform(get("/api/v1/bus-schedules/1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.id").value(1))
                                .andExpect(jsonPath("$.name").value("Express"))
                                .andExpect(jsonPath("$.busNumber").value("BUS001"));
        }

        @Test
        void testGetBusStops() throws Exception {
                mockMvc.perform(get("/api/v1/bus-schedules/1/stops")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$[0].name").value("Stop 1"))
                                .andExpect(jsonPath("$[0].stopOrder").value(1))
                                .andExpect(jsonPath("$[1].name").value("Stop 2"))
                                .andExpect(jsonPath("$[1].stopOrder").value(2));
        }
}
