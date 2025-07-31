package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity for image contributions with manual implementation (no Lombok)
 */
@Entity
@Table(name = "image_contributions")
public class ImageContributionJpaEntity {
    
    @Id
    private String id;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "image_url", nullable = false)
    private String imageUrl;
    
    @Column(name = "description")
    private String description;
    
    @Column(name = "location")
    private String location;
    
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "route_name")
    private String routeName;
    
    @Column(name = "submission_date")
    private LocalDateTime submissionDate;
    
    @Column(name = "additional_notes")
    private String additionalNotes;

    // Default constructor
    public ImageContributionJpaEntity() {}

    // All-args constructor
    public ImageContributionJpaEntity(String id, String userId, String imageUrl, String description,
                                    String location, LocalDateTime createdAt, LocalDateTime updatedAt,
                                    String status, String routeName, LocalDateTime submissionDate,
                                    String additionalNotes) {
        this.id = id;
        this.userId = userId;
        this.imageUrl = imageUrl;
        this.description = description;
        this.location = location;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.status = status;
        this.routeName = routeName;
        this.submissionDate = submissionDate;
        this.additionalNotes = additionalNotes;
    }

    // Getters
    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getImageUrl() { return imageUrl; }
    public String getDescription() { return description; }
    public String getLocation() { return location; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public String getStatus() { return status; }
    public String getRouteName() { return routeName; }
    public LocalDateTime getSubmissionDate() { return submissionDate; }
    public String getAdditionalNotes() { return additionalNotes; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setDescription(String description) { this.description = description; }
    public void setLocation(String location) { this.location = location; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
    public void setStatus(String status) { this.status = status; }
    public void setRouteName(String routeName) { this.routeName = routeName; }
    public void setSubmissionDate(LocalDateTime submissionDate) { this.submissionDate = submissionDate; }
    public void setAdditionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; }

    // equals and hashCode (based on id only)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ImageContributionJpaEntity that = (ImageContributionJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "ImageContributionJpaEntity{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", imageUrl='" + imageUrl + '\'' +
                ", description='" + description + '\'' +
                ", location='" + location + '\'' +
                ", status='" + status + '\'' +
                ", routeName='" + routeName + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                ", submissionDate=" + submissionDate +
                '}';
    }

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public Builder toBuilder() {
        return new Builder()
                .id(this.id)
                .userId(this.userId)
                .imageUrl(this.imageUrl)
                .description(this.description)
                .location(this.location)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .status(this.status)
                .routeName(this.routeName)
                .submissionDate(this.submissionDate)
                .additionalNotes(this.additionalNotes);
    }

    public static class Builder {
        private String id;
        private String userId;
        private String imageUrl;
        private String description;
        private String location;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private String status;
        private String routeName;
        private LocalDateTime submissionDate;
        private String additionalNotes;

        private Builder() {}

        public Builder id(String id) { this.id = id; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder imageUrl(String imageUrl) { this.imageUrl = imageUrl; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder location(String location) { this.location = location; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder routeName(String routeName) { this.routeName = routeName; return this; }
        public Builder submissionDate(LocalDateTime submissionDate) { this.submissionDate = submissionDate; return this; }
        public Builder additionalNotes(String additionalNotes) { this.additionalNotes = additionalNotes; return this; }

        public ImageContributionJpaEntity build() {
            return new ImageContributionJpaEntity(id, userId, imageUrl, description, location,
                    createdAt, updatedAt, status, routeName, submissionDate, additionalNotes);
        }
    }
}
