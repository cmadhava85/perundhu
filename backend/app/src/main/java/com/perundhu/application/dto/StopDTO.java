package com.perundhu.application.dto;

import java.time.LocalTime;

import lombok.Value;

@Value
public class StopDTO {
    String name;
    String translatedName;
    LocalTime arrivalTime;
    LocalTime departureTime;
    Integer stopOrder;
    // Add location coordinates for map display
    Double latitude;
    Double longitude;
}