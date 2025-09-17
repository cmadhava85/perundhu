package com.perundhu.domain.model;

/**
 * Value object representing a Bus identifier using Java 17 record
 */
public record BusId(Long value) {
  public BusId {
    if (value == null || value <= 0) {
      throw new IllegalArgumentException("Bus ID must be a positive number");
    }
  }

  public static BusId of(Long value) {
    return new BusId(value);
  }

  public static BusId of(String value) {
    try {
      return new BusId(Long.parseLong(value));
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid Bus ID format: " + value, e);
    }
  }

  // Traditional getter method for backward compatibility
  public Long getValue() {
    return value;
  }
}