package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/**
 * JPA Entity for Timing Image Contributions
 */
@Entity
@Table(name = "timing_image_contributions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TimingImageContributionEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id")
  private String userId;

  @Column(name = "image_url", nullable = false, length = 500)
  private String imageUrl;

  @Column(name = "thumbnail_url", length = 500)
  private String thumbnailUrl;

  @Column(name = "origin_location", nullable = false, length = 200)
  private String originLocation;

  @Column(name = "origin_location_tamil", length = 200)
  private String originLocationTamil;

  @Column(name = "origin_latitude", precision = 10, scale = 8)
  private BigDecimal originLatitude;

  @Column(name = "origin_longitude", precision = 11, scale = 8)
  private BigDecimal originLongitude;

  @Enumerated(EnumType.STRING)
  @Column(name = "board_type")
  private BoardType boardType;

  @Column(name = "description", columnDefinition = "TEXT")
  private String description;

  @Column(name = "submission_date", nullable = false)
  private LocalDateTime submissionDate;

  @Enumerated(EnumType.STRING)
  @Column(name = "status", nullable = false)
  private TimingImageStatus status;

  @Column(name = "validation_message", columnDefinition = "TEXT")
  private String validationMessage;

  @Column(name = "processed_date")
  private LocalDateTime processedDate;

  @Column(name = "processed_by", length = 100)
  private String processedBy;

  @Column(name = "submitted_by", length = 100)
  private String submittedBy;

  @Column(name = "ocr_confidence", precision = 3, scale = 2)
  private BigDecimal ocrConfidence;

  @Column(name = "requires_manual_review")
  private Boolean requiresManualReview;

  @Enumerated(EnumType.STRING)
  @Column(name = "duplicate_check_status")
  private DuplicateCheckStatus duplicateCheckStatus;

  @Column(name = "merged_records")
  private Integer mergedRecords;

  @Column(name = "created_records")
  private Integer createdRecords;

  // Language detection fields
  @Column(name = "detected_language", length = 10)
  private String detectedLanguage;

  @Column(name = "detected_languages", columnDefinition = "JSON")
  private String detectedLanguages;

  @Column(name = "ocr_text_original", columnDefinition = "TEXT")
  private String ocrTextOriginal;

  @Column(name = "ocr_text_english", columnDefinition = "TEXT")
  private String ocrTextEnglish;

  @Column(name = "created_at", nullable = false, updatable = false)
  private LocalDateTime createdAt;

  @Column(name = "updated_at")
  private LocalDateTime updatedAt;

  @OneToMany(mappedBy = "contribution", cascade = CascadeType.ALL, orphanRemoval = true)
  @Builder.Default
  private List<ExtractedBusTimingEntity> extractedTimings = new ArrayList<>();

  @PrePersist
  protected void onCreate() {
    createdAt = LocalDateTime.now();
    updatedAt = LocalDateTime.now();
    if (submissionDate == null) {
      submissionDate = LocalDateTime.now();
    }
    if (status == null) {
      status = TimingImageStatus.PENDING;
    }
    if (requiresManualReview == null) {
      requiresManualReview = false;
    }
    if (mergedRecords == null) {
      mergedRecords = 0;
    }
    if (createdRecords == null) {
      createdRecords = 0;
    }
  }

  @PreUpdate
  protected void onUpdate() {
    updatedAt = LocalDateTime.now();
  }

  public enum BoardType {
    GOVERNMENT, PRIVATE, LOCAL, INTER_CITY
  }

  public enum TimingImageStatus {
    PENDING, APPROVED, REJECTED, PROCESSING
  }

  public enum DuplicateCheckStatus {
    CHECKED, DUPLICATES_FOUND, UNIQUE, SKIPPED
  }
}
