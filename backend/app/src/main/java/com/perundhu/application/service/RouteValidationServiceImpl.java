package com.perundhu.application.service;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.service.LocationValidationService;
import com.perundhu.domain.service.RouteValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * Implementation of route validation service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RouteValidationServiceImpl implements RouteValidationService {

  private final LocationValidationService locationValidationService;

  @Override
  public boolean isValidRoute(Location fromLocation, Location toLocation) {
    if (fromLocation == null || toLocation == null) {
      return false;
    }

    // Validate both locations exist and are valid
    if (!locationValidationService.isValidLocation(fromLocation.name()) ||
        !locationValidationService.isValidLocation(toLocation.name())) {
      return false;
    }

    // Ensure from and to locations are different
    if (fromLocation.name().equals(toLocation.name())) {
      return false;
    }

    // Additional route validation logic can be added here
    return true;
  }

  @Override
  public boolean isValidRouteDistance(Location fromLocation, Location toLocation) {
    if (fromLocation == null || toLocation == null) {
      return false;
    }

    double distance = calculateDistance(
        fromLocation.latitude(), fromLocation.longitude(),
        toLocation.latitude(), toLocation.longitude());

    // Check if distance is reasonable for a bus route (e.g., less than 1000km)
    return distance > 0 && distance < 1000;
  }

  @Override
  public double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
    // Haversine formula to calculate distance between two points
    final int EARTH_RADIUS = 6371; // Radius of the earth in km

    double latDistance = Math.toRadians(lat2 - lat1);
    double lonDistance = Math.toRadians(lon2 - lon1);

    double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
        + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
            * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

    double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return EARTH_RADIUS * c; // Distance in km
  }

  @Override
  public boolean validateRouteLocations(Location fromLocation, Location toLocation) {
    if (fromLocation == null || toLocation == null) {
      return false;
    }

    // Validate individual locations
    if (!locationValidationService.isValidLocation(fromLocation.name())) {
      log.warn("Invalid from location: {}", fromLocation.name());
      return false;
    }

    if (!locationValidationService.isValidLocation(toLocation.name())) {
      log.warn("Invalid to location: {}", toLocation.name());
      return false;
    }

    // Ensure locations are different
    if (fromLocation.name().equals(toLocation.name())) {
      log.warn("From and to locations cannot be the same: {}", fromLocation.name());
      return false;
    }

    // Validate coordinates if available
    if (fromLocation.latitude() != null && fromLocation.longitude() != null &&
        toLocation.latitude() != null && toLocation.longitude() != null) {

      if (!locationValidationService.isValidLocationCoordinates(
          fromLocation.latitude(), fromLocation.longitude())) {
        log.warn("Invalid coordinates for from location: {}", fromLocation.name());
        return false;
      }

      if (!locationValidationService.isValidLocationCoordinates(
          toLocation.latitude(), toLocation.longitude())) {
        log.warn("Invalid coordinates for to location: {}", toLocation.name());
        return false;
      }

      // Check if distance is reasonable
      if (!isValidRouteDistance(fromLocation, toLocation)) {
        log.warn("Invalid route distance between {} and {}",
            fromLocation.name(), toLocation.name());
        return false;
      }
    }

    return true;
  }
}