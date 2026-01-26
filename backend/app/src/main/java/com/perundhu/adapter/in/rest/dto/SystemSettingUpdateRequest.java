package com.perundhu.adapter.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request DTO for updating system settings with validation
 */
public record SystemSettingUpdateRequest(
        @NotBlank(message = "Setting key is required")
        @Pattern(regexp = "^[a-z][a-z0-9._-]*$",
                 message = "Setting key must start with lowercase letter and contain only lowercase letters, numbers, dots, underscores, and hyphens")
        @Size(min = 3, max = 100, message = "Setting key must be between 3 and 100 characters")
        String key,

        @NotBlank(message = "Setting value is required")
        @Size(max = 1000, message = "Setting value must not exceed 1000 characters")
        String value,

        @Size(max = 200, message = "Description must not exceed 200 characters")
        String description
) {
}
