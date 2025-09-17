package com.perundhu.domain.model;

/**
 * Value object representing a Stop identifier using Java 17 record
 */
public record StopId(Long value) {
  public StopId {
    if (value == null || value <= 0) {
      throw new IllegalArgumentException("Stop ID must be a positive number");
    }
  }

  public static StopId of(Long value) {
    return new StopId(value);
  }

  public static StopId of(String value) {
    try {
      return new StopId(Long.parseLong(value));
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid Stop ID format: " + value, e);
    }
  }

  // Traditional getter method for backward compatibility
  public Long getValue() {
    return value;
  }
}