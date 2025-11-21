package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.time.LocalTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA Entity for Bus Timing Records (Final approved data)
 */
@Entity
@Table(name = "bus_timing_records", uniqueConstraints = @UniqueConstraint(columnNames = { "from_location_id",
    "to_location_id", "departure_time", "timing_type" }))
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusTimingRecordEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "bus_id")
  private Long busId;

  @Column(name = "from_location_id", nullable = false)
  private Long fromLocationId;

  @Column(name = "from_location_name", nullable = false, length = 200)
  private String fromLocationName;

  @Column(name = "to_location_id", nullable = false)
  private Long toLocationId;

  @Column(name = "to_location_name", nullable = false, length = 200)
  private String toLocationName;

  @Column(name = "departure_time", nullable = false)
  private LocalTime departureTime;

  @Column(name = "arrival_time")
  private LocalTime arrivalTime;

  @Enumerated(EnumType.STRING)
  @Column(name = "timing_type", nullable = false)
  private TimingType timingType;

  @Enumerated(EnumType.STRING)
  @Column(name = "source")
  private TimingSource source;

  @Column(name = "contribution_id")
  private Long contributionId;

  @Column(name = "verified")
  private Boolean verified;

  @Column(name = "last_updated")
  private LocalDateTime lastUpdated;

  @PrePersist
  protected void onCreate() {
    if (verified == null) {
      verified = false;
    }
    if (source == null) {
      source = TimingSource.OCR_EXTRACTED;
    }
    lastUpdated = LocalDateTime.now();
  }

  @PreUpdate
  protected void onUpdate() {
    lastUpdated = LocalDateTime.now();
  }

  public enum TimingType {
    MORNING, AFTERNOON, NIGHT
  }

  public enum TimingSource {
    USER_CONTRIBUTION, OFFICIAL, OCR_EXTRACTED
  }
}
