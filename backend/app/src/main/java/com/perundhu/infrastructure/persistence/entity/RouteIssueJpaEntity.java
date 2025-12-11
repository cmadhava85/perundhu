package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * JPA entity for user-reported issues with bus routes or timings.
 */
@Entity
@Table(name = "route_issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteIssueJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "bus_id")
    private Long busId;

    @Column(name = "bus_name")
    private String busName;

    @Column(name = "bus_number")
    private String busNumber;

    @Column(name = "from_location")
    private String fromLocation;

    @Column(name = "to_location")
    private String toLocation;

    @Enumerated(EnumType.STRING)
    @Column(name = "issue_type", nullable = false)
    private IssueType issueType;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Column(name = "suggested_departure_time")
    private String suggestedDepartureTime;

    @Column(name = "suggested_arrival_time")
    private String suggestedArrivalTime;

    @Column(name = "last_traveled_date")
    private String lastTraveledDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    @Builder.Default
    private IssueStatus status = IssueStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "priority")
    @Builder.Default
    private IssuePriority priority = IssuePriority.MEDIUM;

    @Column(name = "report_count")
    @Builder.Default
    private Integer reportCount = 1;

    @Column(name = "reporter_id")
    private String reporterId;

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @Column(name = "resolution")
    private String resolution;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Types of issues that can be reported
     */
    public enum IssueType {
        BUS_NOT_AVAILABLE,
        WRONG_TIMING,
        WRONG_SCHEDULE,
        WRONG_STOPS,
        WRONG_FARE,
        ROUTE_CHANGED,
        SERVICE_SUSPENDED,
        OTHER
    }

    /**
     * Status of the issue report
     */
    public enum IssueStatus {
        PENDING,
        UNDER_REVIEW,
        CONFIRMED,
        RESOLVED,
        REJECTED,
        CANNOT_VERIFY
    }

    /**
     * Priority of the issue
     */
    public enum IssuePriority {
        LOW,
        MEDIUM,
        HIGH,
        CRITICAL
    }
}
