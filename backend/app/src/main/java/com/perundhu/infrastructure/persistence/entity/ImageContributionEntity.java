package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.ImageContribution.ImageContributionId;
import com.perundhu.domain.model.ImageContribution.ContributionStatus;

/**
 * JPA entity for image contributions using Java 17 features (no Lombok, no Builder pattern)
 */
@Entity
@Table(name = "image_contributions")
public class ImageContributionEntity {
    
    // Constants for status values
    private static final String STATUS_PENDING = "PENDING";

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
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor (required by JPA)
    public ImageContributionEntity() {}

    // Constructor with essential fields
    public ImageContributionEntity(String userId, String busNumber, String imageUrl,
                                 String description, String location) {
        var now = LocalDateTime.now();
        this.userId = userId;
        this.busNumber = busNumber;
        this.imageUrl = imageUrl;
        this.description = description;
        this.location = location;
        this.submissionDate = now;
        this.status = STATUS_PENDING;
        this.createdAt = now;
        this.updatedAt = now;
    }

    // Factory method for creating new image contributions
    public static ImageContributionEntity of(String userId, String busNumber, String imageUrl,
                                            String description, String location) {
        return new ImageContributionEntity(userId, busNumber, imageUrl, description, location);
    }

    // Factory method with additional fields
    public static ImageContributionEntity of(String userId, String busNumber, String imageUrl,
                                            String description, String location, String routeName,
                                            String status) {
        var entity = new ImageContributionEntity(userId, busNumber, imageUrl, description, location);
        entity.routeName = routeName;
        entity.status = status != null ? status : STATUS_PENDING;
        return entity;
    }

    // Getters
    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public String getBusNumber() { return busNumber; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public String getRouteName() { return routeName; }
    public String getImageUrl() { return imageUrl; }
    public String getImageDescription() { return imageDescription; }
    public String getLocationName() { return locationName; }
    public LocalDateTime getSubmissionDate() { return submissionDate; }
    public String getStatus() { return status; }
    public String getExtractedData() { return extractedData; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }
    public void setDescription(String description) { this.description = description; }
    public void setLocation(String location) { this.location = location; }
    public void setRouteName(String routeName) { this.routeName = routeName; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setImageDescription(String imageDescription) { this.imageDescription = imageDescription; }
    public void setLocationName(String locationName) { this.locationName = locationName; }
    public void setSubmissionDate(LocalDateTime submissionDate) { this.submissionDate = submissionDate; }
    public void setStatus(String status) { this.status = status; }
    public void setExtractedData(String extractedData) { this.extractedData = extractedData; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // equals, hashCode, toString using Java 17 features
    @Override
    public boolean equals(Object obj) {
        return obj instanceof ImageContributionEntity other && Objects.equals(id, other.id);
    }

    @Override
    public int hashCode() {
        return Objects.hashCode(id);
    }

    @Override
    public String toString() {
        return String.format("""
            ImageContributionEntity{
                id=%s,
                userId='%s',
                busNumber='%s',
                description='%s',
                location='%s',
                routeName='%s',
                imageUrl='%s',
                status='%s',
                submissionDate=%s,
                createdAt=%s,
                updatedAt=%s
            }""",
            id, userId, busNumber, description, location, routeName,
            imageUrl, status, submissionDate, createdAt, updatedAt);
    }

    // Domain model conversion using Java 17 features
    public static ImageContributionEntity fromDomainModel(ImageContribution contribution) {
        if (contribution == null) return null;

        var entity = new ImageContributionEntity();
        var now = LocalDateTime.now();

        entity.id = contribution.id() != null ? Long.valueOf(contribution.id().value()) : null;
        entity.userId = contribution.userId();
        entity.busNumber = contribution.busNumber();
        entity.description = contribution.description();
        entity.location = contribution.location();
        entity.routeName = contribution.routeName();
        entity.imageUrl = contribution.imageUrl();
        entity.imageDescription = contribution.imageDescription();
        entity.locationName = contribution.locationName();
        entity.submissionDate = contribution.submissionDate() != null ? contribution.submissionDate() : now;
        entity.status = contribution.status() != null ? contribution.status().name() : STATUS_PENDING;
        entity.extractedData = contribution.extractedData();
        entity.createdAt = now;  // Always set to now for entity creation
        entity.updatedAt = now;

        return entity;
    }

    public ImageContribution toDomainModel() {
        return new ImageContribution(
                id != null ? new ImageContributionId(String.valueOf(id)) : null,
                userId,
                description,
                location,
                routeName,
                imageUrl,
                ContributionStatus.valueOf(status),
                submissionDate,
                null, // processedDate - not stored in entity yet
                null, // additionalNotes - not stored in entity yet
                null, // validationMessage - not stored in entity yet
                busNumber,
                imageDescription,
                locationName,
                extractedData
        );
    }

    // Utility methods using Java 17 style
    public ImageContributionEntity withUpdatedStatus(String newStatus) {
        this.status = newStatus;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    public ImageContributionEntity withExtractedData(String data) {
        this.extractedData = data;
        this.updatedAt = LocalDateTime.now();
        return this;
    }

    // Check if contribution is recently submitted (within last hour)
    public boolean isRecentlySubmitted() {
        return submissionDate != null && submissionDate.isAfter(LocalDateTime.now().minusHours(1));
    }

    // Get a formatted display string for debugging
    public String toDisplayString() {
        return String.format("Image contribution by %s for bus %s [%s] - %s",
            userId, busNumber, status, description != null ? description.substring(0, Math.min(50, description.length())) + "..." : "No description");
    }
}
