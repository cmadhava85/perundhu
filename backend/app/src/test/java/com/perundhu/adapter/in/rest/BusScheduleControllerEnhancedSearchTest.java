package com.perundhu.adapter.in.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.google.common.util.concurrent.RateLimiter;
import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.ConnectingRouteService;
import com.perundhu.application.service.OpenStreetMapGeocodingService;

import java.util.concurrent.ConcurrentHashMap;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BusScheduleControllerEnhancedSearchTest {

        private MockMvc mockMvc;

        @Mock
        private BusScheduleService busScheduleService;

        @Mock
        private ConnectingRouteService connectingRouteService;

        @Mock
        private OpenStreetMapGeocodingService geocodingService;

        @Mock
        private RateLimiter globalRateLimiter;

        @Mock
        private ConcurrentHashMap<String, RateLimiter> userRateLimiters;

        @InjectMocks
        private BusScheduleController controller;

        private List<BusDTO> testDirectBuses;
        private List<BusDTO> testViaBuses;
        private List<BusDTO> testContinuingBuses;

        @BeforeEach
        void setUp() {
                // Mock rate limiters to always allow requests
                when(globalRateLimiter.tryAcquire(anyLong(), any())).thenReturn(true);
                when(userRateLimiters.computeIfAbsent(any(), any())).thenReturn(globalRateLimiter);

                mockMvc = MockMvcBuilders.standaloneSetup(controller).build();

                testDirectBuses = Arrays.asList(
                                BusDTO.of(1L, "EXP001", "Express Bus", "Express Operator", "Express"),
                                BusDTO.of(2L, "REG002", "Regular Bus", "Regular Operator", "Regular"));

                testViaBuses = Arrays.asList(
                                BusDTO.of(3L, "VIA003", "Via Bus", "Via Operator", "Regular"));

                testContinuingBuses = Arrays.asList(
                                BusDTO.of(4L, "CONT004", "Continuing Bus (via Bangalore)", "Continuing Operator",
                                                "Express"));
        }

        @Test
        void testEnhancedSearch_WithContinuingBuses_Success() throws Exception {
                // Mock the three service methods that the enhanced search endpoint calls
                when(busScheduleService.findBusesBetweenLocations(1L, 2L))
                                .thenReturn(testDirectBuses);
                when(busScheduleService.findBusesPassingThroughLocations(1L, 2L))
                                .thenReturn(testViaBuses);
                when(busScheduleService.findBusesContinuingBeyondDestination(1L, 2L))
                                .thenReturn(testContinuingBuses);

                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocationId", "1")
                                .param("toLocationId", "2")
                                .param("includeContinuing", "true")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.items", hasSize(4))) // All buses combined
                                .andExpect(jsonPath("$.items[0].name", is("Express Bus")))
                                .andExpect(jsonPath("$.items[0].number", is("EXP001"))); // Changed from busNumber to
                                                                                         // number
        }

        @Test
        void testEnhancedSearch_WithoutContinuingBuses_Success() throws Exception {
                when(busScheduleService.findBusesBetweenLocations(1L, 2L))
                                .thenReturn(testDirectBuses);
                when(busScheduleService.findBusesPassingThroughLocations(1L, 2L))
                                .thenReturn(testViaBuses);

                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocationId", "1")
                                .param("toLocationId", "2")
                                .param("includeContinuing", "false")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.items", hasSize(3))) // Direct + via buses only
                                .andExpect(jsonPath("$.items[0].name", is("Express Bus")));
        }

        @Test
        void testEnhancedSearch_SameFromAndToLocation_BadRequest() throws Exception {
                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocationId", "1")
                                .param("toLocationId", "1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isBadRequest());
        }

        @Test
        void testEnhancedSearch_EmptyResults_Success() throws Exception {
                when(busScheduleService.findBusesBetweenLocations(anyLong(), anyLong()))
                                .thenReturn(Collections.emptyList());
                when(busScheduleService.findBusesPassingThroughLocations(anyLong(), anyLong()))
                                .thenReturn(Collections.emptyList());
                when(busScheduleService.findBusesContinuingBeyondDestination(anyLong(), anyLong()))
                                .thenReturn(Collections.emptyList());

                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocationId", "999")
                                .param("toLocationId", "998")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.items", hasSize(0)));
        }

        @Test
        void testEnhancedSearch_ServiceException_InternalServerError() throws Exception {
                when(busScheduleService.findBusesBetweenLocations(anyLong(), anyLong()))
                                .thenThrow(new RuntimeException("Database error"));

                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocationId", "1")
                                .param("toLocationId", "2")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isInternalServerError());
        }

        @Test
        void testEnhancedSearch_LegacyStringParameters_Success() throws Exception {
                when(busScheduleService.searchRoutes("Chennai", "Bangalore", 0, 20))
                                .thenReturn(testDirectBuses);

                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocation", "Chennai")
                                .param("toLocation", "Bangalore")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.items", hasSize(2)))
                                .andExpect(jsonPath("$.items[0].name", is("Express Bus")));
        }

        @Test
        void testEnhancedSearch_PaginationLimit_Success() throws Exception {
                when(busScheduleService.findBusesBetweenLocations(1L, 2L))
                                .thenReturn(testDirectBuses.subList(0, 1));
                when(busScheduleService.findBusesPassingThroughLocations(1L, 2L))
                                .thenReturn(Collections.emptyList());
                when(busScheduleService.findBusesContinuingBeyondDestination(1L, 2L))
                                .thenReturn(Collections.emptyList());

                mockMvc.perform(get("/api/v1/bus-schedules/search")
                                .param("fromLocationId", "1")
                                .param("toLocationId", "2")
                                .param("size", "1")
                                .contentType(MediaType.APPLICATION_JSON))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.items", hasSize(1)))
                                .andExpect(jsonPath("$.items[0].name", is("Express Bus")));
        }
}