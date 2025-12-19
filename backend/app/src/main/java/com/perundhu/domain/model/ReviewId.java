package com.perundhu.domain.model;

/**
 * Value object representing a Review identifier using Java 17 record
 */
public record ReviewId(Long value) {
  public ReviewId {
    if (value == null || value <= 0) {
      throw new IllegalArgumentException("Review ID must be a positive number");
    }
  }

  public static ReviewId of(Long value) {
    return new ReviewId(value);
  }

  public static ReviewId of(String value) {
    try {
      return new ReviewId(Long.parseLong(value));
    } catch (NumberFormatException e) {
      throw new IllegalArgumentException("Invalid Review ID format: " + value, e);
    }
  }

  // Traditional getter method for backward compatibility
  public Long getValue() {
    return value;
  }
}
