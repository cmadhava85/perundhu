package com.perundhu.adapter.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for approving contributions with validation
 */
public record ApproveContributionRequest(
        @NotBlank(message = "Contribution ID is required")
        String id,

        @Size(max = 500, message = "Approval notes must not exceed 500 characters")
        String approvalNotes,

        boolean extractOCRData
) {
}
