package com.perundhu.domain.model;

/**
 * Value object for Bus ID using Java 17 record
 * This is a standalone version for use in repositories and other places
 * that need to reference BusId without importing the entire Bus class
 */
public record BusId(Long value) {
  public BusId {
    if (value == null) {
      throw new IllegalArgumentException("BusId value cannot be null");
    }
  }

  /**
   * Factory method to create a BusId from a Long value
   */
  public static BusId of(Long value) {
    return new BusId(value);
  }

  /**
   * Get the underlying Long value
   */
  public Long getValue() {
    return value;
  }
}