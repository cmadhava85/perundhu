package com.perundhu.infrastructure.persistence.entity;

/**
 * Location type enumeration for hierarchical location management.
 */
public enum LocationType {
    CITY,       // Major city (e.g., Chennai, Madurai)
    TERMINAL,   // Bus terminal/station (e.g., CMBT, KCBT)
    STATION,    // Bus station
    VILLAGE,    // Village
    TOWN        // Town
}
