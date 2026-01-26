package com.perundhu.adapter.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating bus timing with validation
 */
public record BusTimingUpdateRequestDTO(
        @NotBlank(message = "Bus ID is required")
        String busId,

        @Pattern(regexp = "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$", 
                 message = "Departure time must be in HH:mm format (00:00 to 23:59)")
        String departureTime,

        @Pattern(regexp = "^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$",
                 message = "Arrival time must be in HH:mm format (00:00 to 23:59)")
        String arrivalTime,

        @Size(max = 200, message = "Notes must not exceed 200 characters")
        String notes
) {
}
