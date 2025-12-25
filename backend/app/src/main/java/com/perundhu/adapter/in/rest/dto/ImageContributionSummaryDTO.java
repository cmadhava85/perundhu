package com.perundhu.adapter.in.rest.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for image contribution summary (excludes binary image data)
 * Used to return lightweight image contribution information in API responses
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageContributionSummaryDTO {
    
    private String id;
    private String userId;
    private String imageUrl;
    private String description;
    private String location;
    private String routeName;
    private String extractedData;
    private String status;
    private String validationMessage;
    private String additionalNotes;
    private LocalDateTime submissionDate;
    private LocalDateTime processedDate;
    private String imageContentType;
}
