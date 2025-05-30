package com.perundhu.application.dto;

import java.time.LocalTime;

import lombok.Value;

@Value
public class BusScheduleDTO {
    Long id;
    String name;
    String translatedName;
    String busNumber;
    String fromLocationName;
    String fromLocationTranslatedName;
    String toLocationName;
    String toLocationTranslatedName;
    LocalTime departureTime;
    LocalTime arrivalTime;
}