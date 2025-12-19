package com.perundhu.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

/**
 * Domain model representing a user review for a bus service.
 * Immutable domain entity following DDD principles.
 */
public class Review {
    private final ReviewId id;
    private final Long busId;
    private final String userId;
    private final int rating; // 1-5 stars
    private final String comment; // Optional, max 500 chars
    private final List<String> tags; // e.g., ["punctual", "clean", "crowded"]
    private final LocalDate travelDate; // Optional - when they traveled
    private final ReviewStatus status;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    
    // Review status enum
    public enum ReviewStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
    
    private Review(Builder builder) {
        this.id = builder.id;
        this.busId = Objects.requireNonNull(builder.busId, "Bus ID cannot be null");
        this.userId = builder.userId; // Can be null for anonymous reviews
        this.rating = validateRating(builder.rating);
        this.comment = validateComment(builder.comment);
        this.tags = builder.tags != null ? Collections.unmodifiableList(builder.tags) : Collections.emptyList();
        this.travelDate = builder.travelDate;
        this.status = builder.status != null ? builder.status : ReviewStatus.PENDING;
        this.createdAt = builder.createdAt != null ? builder.createdAt : LocalDateTime.now();
        this.updatedAt = builder.updatedAt != null ? builder.updatedAt : LocalDateTime.now();
    }
    
    private int validateRating(int rating) {
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5");
        }
        return rating;
    }
    
    private String validateComment(String comment) {
        if (comment != null && comment.length() > 500) {
            throw new IllegalArgumentException("Comment cannot exceed 500 characters");
        }
        return comment;
    }
    
    // Getters
    public ReviewId getId() { return id; }
    public Long getBusId() { return busId; }
    public String getUserId() { return userId; }
    public int getRating() { return rating; }
    public String getComment() { return comment; }
    public List<String> getTags() { return tags; }
    public LocalDate getTravelDate() { return travelDate; }
    public ReviewStatus getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    
    // Business methods
    public boolean isApproved() {
        return status == ReviewStatus.APPROVED;
    }
    
    public boolean isPending() {
        return status == ReviewStatus.PENDING;
    }
    
    public Review approve() {
        return new Builder()
                .id(this.id)
                .busId(this.busId)
                .userId(this.userId)
                .rating(this.rating)
                .comment(this.comment)
                .tags(this.tags)
                .travelDate(this.travelDate)
                .status(ReviewStatus.APPROVED)
                .createdAt(this.createdAt)
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    public Review reject() {
        return new Builder()
                .id(this.id)
                .busId(this.busId)
                .userId(this.userId)
                .rating(this.rating)
                .comment(this.comment)
                .tags(this.tags)
                .travelDate(this.travelDate)
                .status(ReviewStatus.REJECTED)
                .createdAt(this.createdAt)
                .updatedAt(LocalDateTime.now())
                .build();
    }
    
    // Builder pattern
    public static Builder builder() {
        return new Builder();
    }
    
    public static class Builder {
        private ReviewId id;
        private Long busId;
        private String userId;
        private int rating;
        private String comment;
        private List<String> tags;
        private LocalDate travelDate;
        private ReviewStatus status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        
        public Builder id(ReviewId id) { this.id = id; return this; }
        public Builder id(Long id) { this.id = id != null ? ReviewId.of(id) : null; return this; }
        public Builder busId(Long busId) { this.busId = busId; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder rating(int rating) { this.rating = rating; return this; }
        public Builder comment(String comment) { this.comment = comment; return this; }
        public Builder tags(List<String> tags) { this.tags = tags; return this; }
        public Builder travelDate(LocalDate travelDate) { this.travelDate = travelDate; return this; }
        public Builder status(ReviewStatus status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }
        
        public Review build() {
            return new Review(this);
        }
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Review review = (Review) o;
        return Objects.equals(id, review.id);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(id);
    }
    
    @Override
    public String toString() {
        return "Review{" +
                "id=" + id +
                ", busId=" + busId +
                ", rating=" + rating +
                ", status=" + status +
                '}';
    }
}
