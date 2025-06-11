package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import com.perundhu.domain.model.ImageContribution;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "image_contributions")
@Data
@Builder(toBuilder = true)
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class ImageContributionJpaEntity {
    
    @Id
    @EqualsAndHashCode.Include
    private String id;
    
    @NotBlank(message = "User ID must not be blank")
    @Column(name = "user_id")
    private String userId;
    
    @Size(max = 1000, message = "Description must not exceed 1000 characters")
    @Column(name = "description")
    private String description;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "route_name")
    private String routeName;
    
    @NotBlank(message = "Image URL must not be blank")
    @Column(name = "image_url")
    private String imageUrl;
    
    @NotBlank(message = "Status must not be blank")
    @Column(name = "status")
    private String status;
    
    @NotNull(message = "Submission date must not be null")
    @Column(name = "submission_date")
    private LocalDateTime submissionDate;
    
    @Size(max = 1000, message = "Additional notes must not exceed 1000 characters")
    @Column(name = "additional_notes")
    private String additionalNotes;

    @Column(name = "validation_message")
    private String validationMessage;

    @Column(name = "processed_date")
    private LocalDateTime processedDate;
    
    public static ImageContributionJpaEntity fromDomainModel(ImageContribution contribution) {
        if (contribution == null) return null;
        
        return ImageContributionJpaEntity.builder()
            .id(contribution.getId())
            .userId(contribution.getUserId())
            .description(contribution.getDescription())
            .location(contribution.getLocation())
            .routeName(contribution.getRouteName())
            .imageUrl(contribution.getImageUrl())
            .status(contribution.getStatus())
            .submissionDate(contribution.getSubmissionDate())
            .additionalNotes(contribution.getAdditionalNotes())
            .validationMessage(contribution.getValidationMessage())
            .processedDate(contribution.getProcessedDate())
            .build();
    }
    
    public ImageContribution toDomainModel() {
        return ImageContribution.builder()
            .id(id)
            .userId(userId)
            .description(description)
            .location(location)
            .routeName(routeName)
            .imageUrl(imageUrl)
            .status(status)
            .submissionDate(submissionDate)
            .additionalNotes(additionalNotes)
            .validationMessage(validationMessage)
            .processedDate(processedDate)
            .build();
    }
}