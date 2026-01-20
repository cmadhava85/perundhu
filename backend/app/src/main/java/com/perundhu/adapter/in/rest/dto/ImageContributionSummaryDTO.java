package com.perundhu.adapter.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for image contribution summary (excludes binary image data)
 * Used to return lightweight image contribution information in API responses
 * and for admin list endpoints to avoid sending large payloads
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageContributionSummaryDTO {

    @NotBlank(message = "ID is required")
    private String id;

    @NotBlank(message = "User ID is required")
    @Size(max = 100, message = "User ID must not exceed 100 characters")
    private String userId;

    @Size(max = 500, message = "Image URL must not exceed 500 characters")
    private String imageUrl;

    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    private String description;

    @Size(max = 200, message = "Location must not exceed 200 characters")
    private String location;

    @Size(max = 200, message = "Route name must not exceed 200 characters")
    private String routeName;

    @Size(max = 5000, message = "Extracted data must not exceed 5000 characters")
    private String extractedData;

    @NotBlank(message = "Status is required")
    @Size(max = 50, message = "Status must not exceed 50 characters")
    private String status;

    @Size(max = 1000, message = "Validation message must not exceed 1000 characters")
    private String validationMessage;

    @Size(max = 2000, message = "Additional notes must not exceed 2000 characters")
    private String additionalNotes;

    private LocalDateTime submissionDate;
    private LocalDateTime processedDate;

    @Size(max = 100, message = "Image content type must not exceed 100 characters")
    private String imageContentType;

    // Excluded: imageData (byte[]) to reduce response size
}
