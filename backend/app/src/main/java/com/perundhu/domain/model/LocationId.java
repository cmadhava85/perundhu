package com.perundhu.domain.model;

/**
 * Value object representing a Location identifier using Java 17 record
 */
public record LocationId(Long value) {
  public LocationId {
    if (value == null || value <= 0) {
      throw new IllegalArgumentException("Location ID must be a positive number");
    }
  }

  public static LocationId of(Long value) {
    return new LocationId(value);
  }

  public static LocationId of(String value) {
    try {
      return new LocationId(Long.parseLong(value));
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid Location ID format: " + value, e);
    }
  }
}