package com.perundhu.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for image contributions submitted by users
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class ImageContribution {

    private String id;
    private String userId;
    private String imageUrl;
    private String description;
    private String location;
    private String routeName;
    private String extractedData;
    private String status; // PENDING, APPROVED, REJECTED, PROCESSED, etc.
    private String validationMessage;
    private String additionalNotes;
    private LocalDateTime submissionDate;
    private LocalDateTime processedDate;
    
    // Binary image data for persistent storage (database BLOB)
    private byte[] imageData;
    private String imageContentType;
}