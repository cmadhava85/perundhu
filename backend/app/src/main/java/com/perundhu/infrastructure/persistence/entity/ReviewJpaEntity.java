package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDate;
import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA Entity for bus reviews.
 * Maps to the 'reviews' table in the database.
 */
@Entity
@Table(name = "reviews", indexes = {
    @Index(name = "idx_reviews_bus_id", columnList = "bus_id"),
    @Index(name = "idx_reviews_user_id", columnList = "user_id"),
    @Index(name = "idx_reviews_status", columnList = "status"),
    @Index(name = "idx_reviews_bus_status", columnList = "bus_id, status")
})
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "bus_id", nullable = false)
    private Long busId;
    
    @Column(name = "user_id", length = 255)
    private String userId;
    
    @Column(name = "rating", nullable = false)
    private Integer rating;
    
    @Column(name = "comment", length = 500)
    private String comment;
    
    @Column(name = "tags", length = 500)
    private String tags; // JSON array stored as string
    
    @Column(name = "travel_date")
    private LocalDate travelDate;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private ReviewStatus status = ReviewStatus.PENDING;
    
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
    
    public enum ReviewStatus {
        PENDING,
        APPROVED,
        REJECTED
    }
    
    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = ReviewStatus.PENDING;
        }
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
