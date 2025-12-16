package com.perundhu.application.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for adding stops to an existing bus route.
 * Used when users contribute intermediate stops for routes that are missing them.
 */
public record AddStopsRequest(
    @NotNull(message = "Bus ID is required") 
    Long busId,

    @Size(max = 50, message = "Bus number must be less than 50 characters") 
    String busNumber,

    @Size(max = 200, message = "Bus name must be less than 200 characters") 
    String busName,

    @Size(max = 200, message = "From location name must be less than 200 characters") 
    String fromLocationName,

    @Size(max = 200, message = "To location name must be less than 200 characters") 
    String toLocationName,

    @NotEmpty(message = "At least one stop is required")
    @Valid 
    List<StopEntry> stops,

    @Size(max = 2000, message = "Additional notes must be less than 2000 characters") 
    String additionalNotes
) {
    /**
     * Nested record for stop entries
     */
    public record StopEntry(
        @Size(max = 200, message = "Location name must be less than 200 characters") 
        String locationName,

        Long locationId,

        Double latitude,
        Double longitude,

        @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Arrival time must be in HH:mm format") 
        String arrivalTime,

        @Pattern(regexp = "^([01]?[0-9]|2[0-3]):[0-5][0-9]$", message = "Departure time must be in HH:mm format") 
        String departureTime,

        @NotNull(message = "Stop order is required") 
        Integer order
    ) {}
}
