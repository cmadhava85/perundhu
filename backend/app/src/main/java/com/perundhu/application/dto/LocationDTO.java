package com.perundhu.application.dto;

/**
 * Data Transfer Object for Location information
 */
public record LocationDTO(
    Long id,
    String name,
    String translatedName,
    double latitude,
    double longitude
) {}