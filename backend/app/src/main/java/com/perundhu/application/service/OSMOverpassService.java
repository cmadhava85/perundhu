package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.perundhu.application.dto.OSMBusStopDTO;
import com.perundhu.application.dto.BusRouteDTO;

import java.util.List;
import java.util.ArrayList;

/**
 * Mock implementation of OSM Overpass Service
 * This is a placeholder until the actual OSM integration is implemented
 */
@Service
public class OSMOverpassService {

  private static final Logger log = LoggerFactory.getLogger(OSMOverpassService.class);

  /**
   * Mock method to discover bus stops near a location
   * Returns empty list for now
   */
  public List<OSMBusStopDTO> discoverBusStops(Double latitude, Double longitude, Integer radiusMeters) {
    log.warn("OSMOverpassService.discoverBusStops called - returning empty list (mock implementation)");
    return new ArrayList<>();
  }

  /**
   * Mock method to discover bus routes between locations
   * Returns empty list for now
   */
  public List<BusRouteDTO> discoverBusRoutes(Double fromLat, Double fromLng, Double toLat, Double toLng) {
    log.warn("OSMOverpassService.discoverBusRoutes called - returning empty list (mock implementation)");
    return new ArrayList<>();
  }

  /**
   * Mock method to discover bus stops between two locations
   * Returns empty list for now
   */
  public List<OSMBusStopDTO> discoverBusStopsBetweenLocations(Double fromLat, Double fromLng, Double toLat,
      Double toLng, double radiusKm) {
    log.warn("OSMOverpassService.discoverBusStopsBetweenLocations called - returning empty list (mock implementation)");
    return new ArrayList<>();
  }

  /**
   * Mock method to discover bus routes between two locations
   * Returns empty list for now
   */
  public List<BusRouteDTO> discoverBusRoutesBetween(Double fromLat, Double fromLng, Double toLat, Double toLng,
      double radiusKm) {
    log.warn("OSMOverpassService.discoverBusRoutesBetween called - returning empty list (mock implementation)");
    return new ArrayList<>();
  }
}