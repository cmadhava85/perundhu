package com.perundhu.application.service;

import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.perundhu.application.dto.LocationDTO;

/**
 * Mock implementation of OpenStreetMap Geocoding Service
 * This is a placeholder until the actual OSM integration is implemented
 */
@Service
public class OpenStreetMapGeocodingService {

  private static final Logger log = LoggerFactory.getLogger(OpenStreetMapGeocodingService.class);

  /**
   * Mock method to search for locations using OSM
   * Returns empty list for now
   */
  public List<Object> searchLocations(String query, int limit) {
    log.warn(
        "OpenStreetMapGeocodingService.searchLocations called with query: {} - returning empty list (mock implementation)",
        query);
    return new ArrayList<>();
  }

  /**
   * Mock method to get coordinates for a location
   * Returns null for now
   */
  public Object getCoordinates(String locationName) {
    log.warn(
        "OpenStreetMapGeocodingService.getCoordinates called with location: {} - returning null (mock implementation)",
        locationName);
    return null;
  }

  /**
   * Mock method to search for Indian cities
   * Returns empty list for now
   */
  public List<LocationDTO> searchIndianCities(String query, int limit) {
    log.warn(
        "OpenStreetMapGeocodingService.searchIndianCities called with query: {} - returning empty list (mock implementation)",
        query);
    return new ArrayList<>();
  }

  /**
   * Mock method to update missing coordinates
   * Returns void for now - placeholder implementation
   */
  public void updateMissingCoordinates() {
    log.warn(
        "OpenStreetMapGeocodingService.updateMissingCoordinates called - placeholder implementation (no action taken)");
    // This is a placeholder method - in a real implementation this would:
    // 1. Find locations with null coordinates
    // 2. Call OSM Nominatim API to get coordinates
    // 3. Update the locations in the database
  }
}