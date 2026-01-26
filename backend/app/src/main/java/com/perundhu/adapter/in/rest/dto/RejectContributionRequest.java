package com.perundhu.adapter.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for rejecting contributions with validation
 */
public record RejectContributionRequest(
        @NotBlank(message = "Contribution ID is required")
        String id,

        @NotBlank(message = "Rejection reason is required")
        @Size(min = 10, max = 500, message = "Rejection reason must be between 10 and 500 characters")
        String reason
) {
}
