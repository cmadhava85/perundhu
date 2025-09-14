package com.perundhu.adapter.in.rest;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.service.BusScheduleService;

@ExtendWith(MockitoExtension.class)
class BusScheduleControllerContinuingBusesTest {

  private MockMvc mockMvc;

  @Mock
  private BusScheduleService busScheduleService;

  @InjectMocks
  private BusScheduleController busScheduleController;

  private List<BusDTO> mockContinuingBuses;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(busScheduleController).build();

    mockContinuingBuses = Arrays.asList(
        new BusDTO(
            1L,
            "Express 101 (via Trichy)",
            "TN-01-1234",
            "Chennai",
            "Madurai",
            LocalTime.of(8, 0),
            LocalTime.of(14, 0),
            50, "Express", true),
        new BusDTO(
            2L,
            "Super Deluxe 202 (via Trichy)",
            "TN-02-5678",
            "Chennai",
            "Virudhunagar",
            LocalTime.of(10, 30),
            LocalTime.of(17, 30),
            45, "Deluxe", true));
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_Success() throws Exception {
    // Arrange
    when(busScheduleService.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(mockContinuingBuses);

    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(2))
        .andExpect(jsonPath("$[0].id").value(1))
        .andExpect(jsonPath("$[0].name").value("Express 101 (via Trichy)"))
        .andExpect(jsonPath("$[0].fromLocation").value("Chennai"))
        .andExpect(jsonPath("$[0].toLocation").value("Madurai"))
        .andExpect(jsonPath("$[1].id").value(2))
        .andExpect(jsonPath("$[1].name").value("Super Deluxe 202 (via Trichy)"))
        .andExpect(jsonPath("$[1].fromLocation").value("Chennai"))
        .andExpect(jsonPath("$[1].toLocation").value("Virudhunagar"));

    verify(busScheduleService).findBusesContinuingBeyondDestination(1L, 2L);
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_EmptyResult() throws Exception {
    // Arrange
    when(busScheduleService.findBusesContinuingBeyondDestination(1L, 2L))
        .thenReturn(Arrays.asList());

    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(0));

    verify(busScheduleService).findBusesContinuingBeyondDestination(1L, 2L);
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_MissingFromLocationId() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("toLocationId", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    verify(busScheduleService, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_MissingToLocationId() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    verify(busScheduleService, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_SameFromAndToLocation() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .param("toLocationId", "1")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    verify(busScheduleService, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_InvalidLocationIds() throws Exception {
    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "invalid")
        .param("toLocationId", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .param("toLocationId", "invalid")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    verify(busScheduleService, never()).findBusesContinuingBeyondDestination(anyLong(), anyLong());
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_ServiceException() throws Exception {
    // Arrange
    when(busScheduleService.findBusesContinuingBeyondDestination(1L, 2L))
        .thenThrow(new RuntimeException("Database error"));

    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isInternalServerError());

    verify(busScheduleService).findBusesContinuingBeyondDestination(1L, 2L);
  }

  @Test
  void testSearchBusesContinuingBeyondDestination_IllegalArgumentException() throws Exception {
    // Arrange
    when(busScheduleService.findBusesContinuingBeyondDestination(1L, 2L))
        .thenThrow(new IllegalArgumentException("Invalid arguments"));

    // Act & Assert
    mockMvc.perform(get("/api/v1/bus-schedules/search-continuing-beyond")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .contentType(MediaType.APPLICATION_JSON))
        .andExpect(status().isBadRequest());

    verify(busScheduleService).findBusesContinuingBeyondDestination(1L, 2L);
  }
}