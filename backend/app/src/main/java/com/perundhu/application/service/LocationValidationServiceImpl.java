package com.perundhu.application.service;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.service.LocationValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

/**
 * Implementation of location validation service
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LocationValidationServiceImpl implements LocationValidationService {

  private final LocationRepository locationRepository;

  @Override
  public boolean validateLocation(Location location) {
    if (location == null) {
      return false;
    }

    // Validate location has required fields
    if (location.name() == null || location.name().trim().isEmpty()) {
      return false;
    }

    // Additional validation logic here
    return true;
  }

  @Override
  public boolean isValidLocation(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return false;
    }

    List<Location> locations = locationRepository.findByName(locationName.trim());
    return !locations.isEmpty();
  }

  @Override
  public boolean isValidLocationCoordinates(double latitude, double longitude) {
    // Check if coordinates are within valid bounds for India
    return latitude >= 6.0 && latitude <= 37.0 &&
        longitude >= 68.0 && longitude <= 97.0;
  }

  @Override
  public Optional<Location> findLocationByName(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return Optional.empty();
    }

    List<Location> locations = locationRepository.findByName(locationName.trim());
    return locations.isEmpty() ? Optional.empty() : Optional.of(locations.get(0));
  }

  @Override
  public List<Location> findSimilarLocations(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return List.of();
    }

    // For now, return exact matches. Could be enhanced with fuzzy matching
    return locationRepository.findByName(locationName.trim());
  }
}