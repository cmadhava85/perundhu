package com.perundhu.application.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/**
 * DTO for OSM bus route information
 */
@Data
@Builder
public class BusRouteDTO {
  private long osmId;
  private String routeRef;
  private String routeName;
  private String network;
  private String operator;
  private String fromLocation;
  private String toLocation;
  private double relevanceScore;
  private List<OSMBusStopDTO> stops;
  private String routeType; // "bus", "trolleybus", etc.
  private String frequency;
  private String operatingHours;
  private Double estimatedDuration; // in minutes
  private Double estimatedDistance; // in km
}