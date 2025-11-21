package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalTime;
import java.time.LocalDateTime;

/**
 * JPA Entity for Skipped Timing Records (Audit trail for duplicates)
 */
@Entity
@Table(name = "skipped_timing_records")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SkippedTimingRecordEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "contribution_id", nullable = false)
  private Long contributionId;

  @Column(name = "from_location_id", nullable = false)
  private Long fromLocationId;

  @Column(name = "from_location_name", nullable = false, length = 200)
  private String fromLocationName;

  @Column(name = "to_location_id", nullable = false)
  private Long toLocationId;

  @Column(name = "to_location_name", nullable = false, length = 200)
  private String toLocationName;

  @Column(name = "departure_time")
  private LocalTime departureTime;

  @Enumerated(EnumType.STRING)
  @Column(name = "timing_type", nullable = false)
  private BusTimingRecordEntity.TimingType timingType;

  @Enumerated(EnumType.STRING)
  @Column(name = "skip_reason", nullable = false)
  private SkipReason skipReason;

  @Column(name = "existing_record_id")
  private Long existingRecordId;

  @Enumerated(EnumType.STRING)
  @Column(name = "existing_record_source")
  private BusTimingRecordEntity.TimingSource existingRecordSource;

  @Column(name = "skipped_at", nullable = false)
  private LocalDateTime skippedAt;

  @Column(name = "processed_by", length = 100)
  private String processedBy;

  @Column(name = "notes", columnDefinition = "TEXT")
  private String notes;

  @PrePersist
  protected void onCreate() {
    if (skippedAt == null) {
      skippedAt = LocalDateTime.now();
    }
  }

  public enum SkipReason {
    DUPLICATE_EXACT,
    DUPLICATE_SIMILAR,
    INVALID_TIME,
    INVALID_LOCATION
  }
}
