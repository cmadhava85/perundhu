package com.perundhu.adapter.in.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.concurrent.ConcurrentHashMap;

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
import com.perundhu.application.dto.ConnectingRouteDTO;
import com.perundhu.application.dto.ConnectingRoutesByNameDTO;
import com.perundhu.application.dto.ResolvedLocationInfo;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.ConnectingRouteService;
import com.perundhu.application.service.OverpassGeocodingService;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class BusScheduleControllerConnectingRoutesByNameTest {

  private MockMvc mockMvc;

  @Mock
  private BusScheduleService busScheduleService;

  @Mock
  private ConnectingRouteService connectingRouteService;

  @Mock
  private OverpassGeocodingService geocodingService;

  @Mock
  private RateLimiter globalRateLimiter;

  @Mock
  private ConcurrentHashMap<String, RateLimiter> userRateLimiters;

  @InjectMocks
  private BusScheduleController controller;

  @BeforeEach
  void setUp() {
    when(globalRateLimiter.tryAcquire(anyLong(), any())).thenReturn(true);
    when(userRateLimiters.computeIfAbsent(any(), any())).thenReturn(globalRateLimiter);
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
  }

  @Test
  void connectingRoutesByName_returnsMultipleBusStandOptions() throws Exception {
    List<ResolvedLocationInfo> fromLocations = List.of(
        new ResolvedLocationInfo(11L, "Salem - Old Bus Stand", "BUS_STAND", "Salem - Old Bus Stand", 5),
        new ResolvedLocationInfo(12L, "Salem - New Bus Stand", "BUS_STAND", "Salem - New Bus Stand", 7));

    List<ResolvedLocationInfo> toLocations = List.of(
        new ResolvedLocationInfo(21L, "Madurai", "CITY", null, null));

    List<ConnectingRouteDTO> routes = List.of(
        new ConnectingRouteDTO(
            "route-1",
            11L,
            21L,
            null,
            null,
            List.of(),
            180,
            null,
            1));

    when(busScheduleService.findConnectingRoutesByName("Salem - Old Bus Stand", "Madurai", 2, "en"))
        .thenReturn(new ConnectingRoutesByNameDTO(
            "Salem - Old Bus Stand",
            "Madurai",
            fromLocations,
            toLocations,
            routes,
            fromLocations.size(),
            toLocations.size(),
            routes.size()));

    mockMvc.perform(get("/api/v1/bus-schedules/connecting-routes-by-name")
        .param("from", "Salem - Old Bus Stand")
        .param("to", "Madurai")
        .param("lang", "en")
        .param("maxTransfers", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.fromLocations", hasSize(2)))
        .andExpect(jsonPath("$.fromLocations[0].busStandName", is("Salem - Old Bus Stand")))
        .andExpect(jsonPath("$.fromLocations[1].busStandName", is("Salem - New Bus Stand")))
        .andExpect(jsonPath("$.routes", hasSize(1)));
  }
}
