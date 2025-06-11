package com.perundhu.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for image contributions from users (such as photos of bus schedules)
 */
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
public class ImageContribution {
    private String id;
    private String userId;
    private String description;
    private String location;
    private String routeName;
    private String imageUrl;
    private String status;
    private LocalDateTime submissionDate;
    private LocalDateTime processedDate;
    private String additionalNotes;
    private String validationMessage;
    
    // Additional fields needed by the refactored code
    private String busNumber;
    private String imageDescription;
    private String locationName;
    private String extractedData;
}