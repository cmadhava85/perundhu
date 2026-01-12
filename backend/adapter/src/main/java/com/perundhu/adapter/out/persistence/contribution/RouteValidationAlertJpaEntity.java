package com.perundhu.adapter.out.persistence.contribution;

import com.perundhu.domain.port.RoutingValidationPort;
import jakarta.persistence.*;
import lombok.*;

import java.time.Instant;
import java.util.UUID;

/**
 * JPA entity for storing route validation alerts.
 * Tracks contributions flagged by routing validation engine for admin review.
 * Allows admins to:
 * - Review flagged routes and decide if they are legitimate
 * - Track validation history
 * - Dismiss false positives
 * - Monitor data quality over time
 */
@Entity
@Table(
        name = "route_validation_alerts",
        indexes = {
                @Index(name = "idx_contribution_id", columnList = "contribution_id"),
                @Index(name = "idx_status_created", columnList = "status, created_at DESC"),
                @Index(name = "idx_validation_type", columnList = "validation_type"),
                @Index(name = "idx_confidence_score", columnList = "confidence_score")
        }
)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteValidationAlertJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    
    /**
     * ID of the route contribution being flagged.
     * Foreign key to route_contributions table (soft reference without actual FK).
     */
    @Column(name = "contribution_id", nullable = false)
    private UUID contributionId;
    
    /**
     * Type of validation that triggered the alert.
     * Values: JOURNEY_DURATION, STOP_SEQUENCE, SEGMENT_SPEED
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "validation_type", nullable = false)
    private RoutingValidationPort.ValidationType validationType;
    
    /**
     * Confidence score (0-100) that the contribution has an issue.
     * Higher = more confident there's a problem
     * < 50 = probably valid despite flag
     * 50-75 = questionable
     * > 75 = likely invalid
     */
    @Column(name = "confidence_score", nullable = false)
    private Integer confidenceScore;
    
    /**
     * Expected range for the metric being validated.
     * Examples:
     * - For journey duration: "6-8 hours"
     * - For stop sequence: "Stops on main route path"
     * - For segment speed: "≤ 100 km/h"
     */
    @Column(name = "expected_range", columnDefinition = "VARCHAR(500)")
    private String expectedRange;
    
    /**
     * Actual measured or provided value.
     * Examples:
     * - For journey duration: "3 hours"
     * - For stop sequence: "2 off-route"
     * - For segment speed: "150 km/h max"
     */
    @Column(name = "actual_value", columnDefinition = "VARCHAR(500)")
    private String actualValue;
    
    /**
     * Detailed issue description from validation engine.
     * Human-readable explanation of what triggered the flag.
     */
    @Column(name = "issue_description", columnDefinition = "TEXT")
    private String issueDescription;
    
    /**
     * Current status of the alert.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private AlertStatus status = AlertStatus.PENDING;
    
    /**
     * Optional admin notes about why alert was approved/dismissed.
     */
    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;
    
    /**
     * When the alert was created (when validation flagged the contribution).
     */
    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
    
    /**
     * When the alert was last updated (status change, notes added, etc.).
     */
    @Column(name = "updated_at", nullable = false)
    @Builder.Default
    private Instant updatedAt = Instant.now();
    
    /**
     * When the alert was reviewed/dismissed by admin.
     */
    @Column(name = "reviewed_at")
    private Instant reviewedAt;
    
    /**
     * Email/ID of the admin who reviewed the alert.
     */
    @Column(name = "reviewed_by")
    private String reviewedBy;
    
    /**
     * Status of the validation alert.
     */
    public enum AlertStatus {
        PENDING("Awaiting admin review"),
        APPROVED("Contribution accepted despite flag"),
        DISMISSED("False positive, contribution is valid"),
        REJECTED("Contribution rejected due to validation failure"),
        ESCALATED("Needs further investigation");
        
        public final String description;
        
        AlertStatus(String description) {
            this.description = description;
        }
    }
    
    /**
     * Pre-persist hook: set creation timestamp.
     */
    @PrePersist
    protected void onCreate() {
        createdAt = Instant.now();
        updatedAt = Instant.now();
    }
    
    /**
     * Pre-update hook: update modification timestamp.
     */
    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
