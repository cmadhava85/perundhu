package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity for Extracted Bus Timings
 */
@Entity
@Table(name = "extracted_bus_timings")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExtractedBusTimingEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "contribution_id", nullable = false)
  private TimingImageContributionEntity contribution;

  @Column(name = "destination", nullable = false, length = 200)
  private String destination;

  @Column(name = "destination_tamil", length = 200)
  private String destinationTamil;

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "morning_timings", columnDefinition = "JSON")
  @Builder.Default
  private List<String> morningTimings = new ArrayList<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "afternoon_timings", columnDefinition = "JSON")
  @Builder.Default
  private List<String> afternoonTimings = new ArrayList<>();

  @JdbcTypeCode(SqlTypes.JSON)
  @Column(name = "night_timings", columnDefinition = "JSON")
  @Builder.Default
  private List<String> nightTimings = new ArrayList<>();

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    if (morningTimings == null) {
      morningTimings = new ArrayList<>();
    }
    if (afternoonTimings == null) {
      afternoonTimings = new ArrayList<>();
    }
    if (nightTimings == null) {
      nightTimings = new ArrayList<>();
    }
  }
}
