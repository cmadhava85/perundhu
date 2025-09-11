package com.perundhu.application.dto;

import lombok.Builder;
import lombok.Data;

/**
 * DTO for OSM bus stop data with enhanced facilities information
 */
@Data
@Builder
public class OSMBusStopDTO {
  private long osmId;
  private String name;
  private double latitude;
  private double longitude;
  private String stopType; // "bus_stop", "platform", "station"
  private boolean hasShelter;
  private boolean hasBench;
  private String network;
  private String operator;
  private String accessibility;
  private String surface;
  private Double distanceFromRoute; // Distance from main route in km

  @Override
  public boolean equals(Object o) {
    if (this == o)
      return true;
    if (!(o instanceof OSMBusStopDTO))
      return false;
    OSMBusStopDTO that = (OSMBusStopDTO) o;
    return osmId == that.osmId;
  }

  @Override
  public int hashCode() {
    return Long.hashCode(osmId);
  }
}