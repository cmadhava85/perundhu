package com.perundhu.application.dto;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalTime;
import java.util.List;

/**
 * DTO for route information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RouteDTO {
  private Long id;
  private String name;
  private String description;
  private List<StopDTO> stops;
  private String fromLocation;
  private String toLocation;
  private LocalTime departureTime;
  private LocalTime arrivalTime;
  private String category;
  private boolean active;
}