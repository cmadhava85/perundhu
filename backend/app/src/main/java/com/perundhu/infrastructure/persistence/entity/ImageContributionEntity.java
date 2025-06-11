package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

import com.perundhu.domain.model.ImageContribution;

/**
 * JPA entity for image contributions
 */
@Entity
@Table(name = "image_contributions")
@Data
@NoArgsConstructor
public class ImageContributionEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "bus_number", nullable = false)
    private String busNumber;
    
    @Column(name = "description", length = 1000)
    private String description;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "route_name")
    private String routeName;
    
    @Column(name = "image_url", nullable = false)
    private String imageUrl;
    
    @Column(name = "image_description", length = 1000)
    private String imageDescription;
    
    @Column(name = "location_name")
    private String locationName;
    
    @Column(name = "submission_date", nullable = false)
    private LocalDateTime submissionDate;
    
    @Column(name = "status", nullable = false)
    private String status;
    
    @Column(name = "extracted_data", length = 2000)
    private String extractedData;
    
    @Column(name = "validation_message")
    private String validationMessage;
    
    @Column(name = "additional_notes", length = 1000)
    private String additionalNotes;
    
    @Column(name = "processed_date")
    private LocalDateTime processedDate;
    
    /**
     * Convert JPA entity to domain model
     */
    public ImageContribution toDomainModel() {
        ImageContribution model = new ImageContribution();
        model.setId(this.id != null ? this.id.toString() : null);
        model.setUserId(this.userId);
        model.setBusNumber(this.busNumber);
        model.setDescription(this.description);
        model.setLocation(this.location);
        model.setRouteName(this.routeName);
        model.setImageUrl(this.imageUrl);
        model.setImageDescription(this.imageDescription);
        model.setLocationName(this.locationName);
        model.setStatus(this.status);
        model.setExtractedData(this.extractedData);
        model.setSubmissionDate(this.submissionDate);
        model.setProcessedDate(this.processedDate);
        model.setAdditionalNotes(this.additionalNotes);
        model.setValidationMessage(this.validationMessage);
        return model;
    }
    
    /**
     * Create entity from domain model
     */
    public static ImageContributionEntity fromDomainModel(ImageContribution model) {
        ImageContributionEntity entity = new ImageContributionEntity();
        if (model.getId() != null && !model.getId().isEmpty()) {
            try {
                entity.setId(Long.parseLong(model.getId()));
            } catch (NumberFormatException e) {
                // If ID is not a valid long, leave it as null
            }
        }
        entity.setUserId(model.getUserId());
        entity.setBusNumber(model.getBusNumber());
        entity.setDescription(model.getDescription());
        entity.setLocation(model.getLocation());
        entity.setRouteName(model.getRouteName());
        entity.setImageUrl(model.getImageUrl());
        entity.setImageDescription(model.getImageDescription());
        entity.setLocationName(model.getLocationName());
        entity.setStatus(model.getStatus());
        entity.setExtractedData(model.getExtractedData());
        entity.setSubmissionDate(model.getSubmissionDate());
        entity.setProcessedDate(model.getProcessedDate());
        entity.setAdditionalNotes(model.getAdditionalNotes());
        entity.setValidationMessage(model.getValidationMessage());
        return entity;
    }
}