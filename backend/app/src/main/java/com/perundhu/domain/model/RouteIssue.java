package com.perundhu.domain.model;

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
 * Domain model for user-reported issues with bus routes or timings.
 * Users can report when a bus doesn't exist, timings are wrong,
 * route has been discontinued, etc.
 */
@Entity
@Table(name = "route_issues")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RouteIssue {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  /**
   * Reference to the bus being reported (if known)
   */
  @Column(name = "bus_id")
  private Long busId;

  /**
   * Bus name for display purposes
   */
  @Column(name = "bus_name")
  private String busName;

  /**
   * Bus number if known
   */
  @Column(name = "bus_number")
  private String busNumber;

  /**
   * From location name
   */
  @Column(name = "from_location")
  private String fromLocation;

  /**
   * To location name
   */
  @Column(name = "to_location")
  private String toLocation;

  /**
   * Type of issue being reported
   */
  @Enumerated(EnumType.STRING)
  @Column(name = "issue_type", nullable = false)
  private IssueType issueType;

  /**
   * Detailed description of the issue
   */
  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  /**
   * Suggested correct timing (if timing is wrong)
   */
  @Column(name = "suggested_departure_time")
  private String suggestedDepartureTime;

  /**
   * Suggested correct arrival time (if timing is wrong)
   */
  @Column(name = "suggested_arrival_time")
  private String suggestedArrivalTime;

  /**
   * When the user last traveled this route
   */
  @Column(name = "last_traveled_date")
  private String lastTraveledDate;

  /**
   * Current status of the issue report
   */
  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  @Builder.Default
  private IssueStatus status = IssueStatus.PENDING;

  /**
   * Priority level based on issue type and reports
   */
  @Enumerated(EnumType.STRING)
  @Column(name = "priority")
  @Builder.Default
  private IssuePriority priority = IssuePriority.MEDIUM;

  /**
   * Number of similar reports (for duplicate tracking)
   */
  @Column(name = "report_count")
  @Builder.Default
  private Integer reportCount = 1;

  /**
   * User identifier (anonymous ID or email hash)
   */
  @Column(name = "reporter_id")
  private String reporterId;

  /**
   * Admin notes for internal use
   */
  @Column(name = "admin_notes", columnDefinition = "TEXT")
  private String adminNotes;

  /**
   * Resolution action taken
   */
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
    /** Bus route doesn't exist or has been discontinued */
    BUS_NOT_AVAILABLE,

    /** Departure/arrival timings are wrong */
    WRONG_TIMING,

    /** Bus doesn't run on certain days */
    WRONG_SCHEDULE,

    /** Stops information is incorrect */
    WRONG_STOPS,

    /** Fare information is incorrect */
    WRONG_FARE,

    /** Bus route has changed */
    ROUTE_CHANGED,

    /** Bus service has been temporarily suspended */
    SERVICE_SUSPENDED,

    /** Other issue not covered above */
    OTHER
  }

  /**
   * Status of the issue report
   */
  public enum IssueStatus {
    /** Newly reported, awaiting review */
    PENDING,

    /** Under investigation by admin */
    UNDER_REVIEW,

    /** Confirmed as valid issue */
    CONFIRMED,

    /** Issue has been resolved */
    RESOLVED,

    /** Issue was not valid or duplicate */
    REJECTED,

    /** Cannot verify the issue */
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
