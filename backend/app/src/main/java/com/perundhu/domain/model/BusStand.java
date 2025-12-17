package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

/**
 * Domain entity representing a Bus Stand within a city.
 * A city can have multiple bus stands (e.g., Aruppukottai New Bus Stand, Old
 * Bus Stand)
 */
public record BusStand(
    BusStandId id,
    String busStandName,
    LocationId cityId,
    String cityName,
    Double latitude,
    Double longitude,
    String address,
    String contactPhone,
    BusStandType busStandType,
    LocalTime openingTime,
    LocalTime closingTime,
    boolean hasFoodCourt,
    boolean hasWaitingArea,
    boolean hasParking,
    boolean hasAtm,
    boolean hasRestroom,
    String aliases,
    boolean isActive) {

  /**
   * Constructor with validation
   */
  public BusStand {
    if (busStandName == null || busStandName.trim().isEmpty()) {
      throw new IllegalArgumentException("Bus stand name cannot be null or empty");
    }
    if (cityName == null || cityName.trim().isEmpty()) {
      throw new IllegalArgumentException("City name cannot be null or empty");
    }
    if (latitude == null || longitude == null) {
      throw new IllegalArgumentException("Coordinates cannot be null");
    }
  }

  /**
   * Simplified constructor for basic bus stand info
   */
  public BusStand(BusStandId id, String busStandName, LocationId cityId, String cityName,
      Double latitude, Double longitude, BusStandType busStandType) {
    this(id, busStandName, cityId, cityName, latitude, longitude, null, null,
        busStandType, null, null, false, true, false, false, true, null, true);
  }

  // Getter methods for compatibility
  public BusStandId getId() {
    return id;
  }

  public String getBusStandName() {
    return busStandName;
  }

  public LocationId getCityId() {
    return cityId;
  }

  public String getCityName() {
    return cityName;
  }

  public Double getLatitude() {
    return latitude;
  }

  public Double getLongitude() {
    return longitude;
  }

  public String getAddress() {
    return address;
  }

  public String getContactPhone() {
    return contactPhone;
  }

  public BusStandType getBusStandType() {
    return busStandType;
  }

  public LocalTime getOpeningTime() {
    return openingTime;
  }

  public LocalTime getClosingTime() {
    return closingTime;
  }

  public boolean isHasFoodCourt() {
    return hasFoodCourt;
  }

  public boolean isHasWaitingArea() {
    return hasWaitingArea;
  }

  public boolean isHasParking() {
    return hasParking;
  }

  public boolean isHasAtm() {
    return hasAtm;
  }

  public boolean isHasRestroom() {
    return hasRestroom;
  }

  public String getAliases() {
    return aliases;
  }

  public boolean isActive() {
    return isActive;
  }

  /**
   * Get list of alias names for this bus stand
   */
  public List<String> getAliasList() {
    if (aliases == null || aliases.isBlank()) {
      return Collections.emptyList();
    }
    return Arrays.stream(aliases.split(","))
        .map(String::trim)
        .filter(s -> !s.isEmpty())
        .toList();
  }

  /**
   * Get display name with city
   */
  public String getDisplayName() {
    return busStandName;
  }

  /**
   * Get short display name (without city prefix if it exists)
   */
  public String getShortDisplayName() {
    if (busStandName.toLowerCase().startsWith(cityName.toLowerCase())) {
      String suffix = busStandName.substring(cityName.length()).trim();
      return suffix.isEmpty() ? busStandName : suffix;
    }
    return busStandName;
  }

  /**
   * Get list of available facilities
   */
  public List<String> getFacilities() {
    var facilities = new java.util.ArrayList<String>();
    if (hasWaitingArea)
      facilities.add("waiting_area");
    if (hasRestroom)
      facilities.add("restroom");
    if (hasFoodCourt)
      facilities.add("food_court");
    if (hasAtm)
      facilities.add("atm");
    if (hasParking)
      facilities.add("parking");
    return facilities;
  }

  /**
   * Check if bus stand matches a search term (name or alias)
   */
  public boolean matchesSearchTerm(String searchTerm) {
    if (searchTerm == null || searchTerm.isBlank()) {
      return false;
    }
    String term = searchTerm.toLowerCase().trim();

    // Check main name
    if (busStandName.toLowerCase().contains(term)) {
      return true;
    }

    // Check city name
    if (cityName.toLowerCase().contains(term)) {
      return true;
    }

    // Check aliases
    return getAliasList().stream()
        .anyMatch(alias -> alias.toLowerCase().contains(term));
  }

  /**
   * Factory method for creating a reference by ID
   */
  public static BusStand reference(Long id) {
    return new BusStand(
        new BusStandId(id),
        "Reference",
        null,
        "Reference",
        0.0,
        0.0,
        BusStandType.TNSTC);
  }
}
