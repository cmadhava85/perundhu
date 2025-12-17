package com.perundhu.domain.model;

/**
 * Value object representing a Bus Stand ID
 */
public record BusStandId(Long value) {

  public BusStandId {
    if (value != null && value < 0) {
      throw new IllegalArgumentException("Bus Stand ID cannot be negative");
    }
  }

  public static BusStandId of(Long value) {
    return value != null ? new BusStandId(value) : null;
  }

  @Override
  public String toString() {
    return value != null ? value.toString() : "null";
  }
}
