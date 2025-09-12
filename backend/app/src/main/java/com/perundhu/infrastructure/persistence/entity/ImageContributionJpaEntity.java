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
public class ImageContributionJpaEntity {

    @Id
    @Column(name = "id", length = 36)
    private String id;

    @Column(name = "user_id", nullable = false, length = 50)
    private String userId;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "location", length = 100)
    private String location;

    @Column(name = "route_name", length = 100)
    private String routeName;

    @Column(name = "image_url", nullable = false, length = 1000)
    private String imageUrl;

    @Column(name = "status", nullable = false, length = 20)
    private String status;

    @Column(name = "submission_date", nullable = false)
    private LocalDateTime submissionDate;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;

    @Column(name = "additional_notes", length = 1000)
    private String additionalNotes;

    @Column(name = "validation_message", columnDefinition = "TEXT")
    private String validationMessage;

    @Column(name = "extracted_data", columnDefinition = "TEXT")
    private String extractedData;

    /**
     * Convert JPA entity to domain model
     */
    public ImageContribution toDomainModel() {
        ImageContribution model = new ImageContribution();
        model.setId(this.id);
        model.setUserId(this.userId);
        model.setDescription(this.description);
        model.setLocation(this.location);
        model.setRouteName(this.routeName);
        model.setImageUrl(this.imageUrl);
        model.setStatus(this.status);
        model.setSubmissionDate(this.submissionDate);
        model.setProcessedDate(this.processedDate);
        model.setAdditionalNotes(this.additionalNotes);
        model.setValidationMessage(this.validationMessage);
        model.setExtractedData(this.extractedData);
        return model;
    }

    /**
     * Create entity from domain model
     */
    public static ImageContributionJpaEntity fromDomainModel(ImageContribution model) {
        ImageContributionJpaEntity entity = new ImageContributionJpaEntity();
        entity.setId(model.getId());
        entity.setUserId(model.getUserId());
        entity.setDescription(model.getDescription());
        entity.setLocation(model.getLocation());
        entity.setRouteName(model.getRouteName());
        entity.setImageUrl(model.getImageUrl());
        entity.setStatus(model.getStatus());
        entity.setSubmissionDate(model.getSubmissionDate());
        entity.setProcessedDate(model.getProcessedDate());
        entity.setAdditionalNotes(model.getAdditionalNotes());
        entity.setValidationMessage(model.getValidationMessage());
        entity.setExtractedData(model.getExtractedData());
        return entity;
    }
}