package com.perundhu.domain.model;

/**
 * Enum representing the type of bus stand
 */
public enum BusStandType {
  MAIN, // Main government bus stand
  PRIVATE, // Private bus operators
  TNSTC, // Tamil Nadu State Transport Corporation
  SETC; // State Express Transport Corporation

  public static BusStandType fromString(String value) {
    if (value == null || value.isBlank()) {
      return TNSTC; // Default
    }
    try {
      return valueOf(value.toUpperCase());
    } catch (IllegalArgumentException e) {
      return TNSTC;
    }
  }
}
