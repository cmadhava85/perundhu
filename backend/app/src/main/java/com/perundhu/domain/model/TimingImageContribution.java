package com.perundhu.domain.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class TimingImageContribution {
  private Long id;
  private String userId;
  private String imageUrl;
  private String thumbnailUrl;
  private String originLocation;
  private String originLocationTamil;
  private BigDecimal originLatitude;
  private BigDecimal originLongitude;
  private BoardType boardType;
  private String description;
  private LocalDateTime submissionDate;
  private TimingImageStatus status;
  private String validationMessage;
  private LocalDateTime processedDate;
  private String processedBy;
  private String submittedBy;
  private BigDecimal ocrConfidence;
  private Boolean requiresManualReview;
  private DuplicateCheckStatus duplicateCheckStatus;
  private Integer mergedRecords;
  private Integer createdRecords;
  private List<ExtractedBusTiming> extractedTimings;

  // Language detection fields
  private String detectedLanguage; // Primary language code: en, ta, hi, etc.
  private String detectedLanguages; // JSON: All detected languages with confidence
  private String ocrTextOriginal; // Original OCR text before translation
  private String ocrTextEnglish; // Translated text if original was not English

  public enum BoardType {
    GOVERNMENT, PRIVATE, LOCAL, INTER_CITY
  }

  public enum TimingImageStatus {
    PENDING, APPROVED, REJECTED, PROCESSING
  }

  public enum DuplicateCheckStatus {
    CHECKED, DUPLICATES_FOUND, UNIQUE, SKIPPED
  }

  public TimingImageContribution() {
    this.status = TimingImageStatus.PENDING;
    this.submissionDate = LocalDateTime.now();
    this.requiresManualReview = false;
    this.mergedRecords = 0;
    this.createdRecords = 0;
    this.extractedTimings = new ArrayList<>();
  }

  public static TimingImageContributionBuilder builder() {
    return new TimingImageContributionBuilder();
  }

  // Getters and Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getUserId() {
    return userId;
  }

  public void setUserId(String userId) {
    this.userId = userId;
  }

  public String getImageUrl() {
    return imageUrl;
  }

  public void setImageUrl(String imageUrl) {
    this.imageUrl = imageUrl;
  }

  public String getThumbnailUrl() {
    return thumbnailUrl;
  }

  public void setThumbnailUrl(String thumbnailUrl) {
    this.thumbnailUrl = thumbnailUrl;
  }

  public String getOriginLocation() {
    return originLocation;
  }

  public void setOriginLocation(String originLocation) {
    this.originLocation = originLocation;
  }

  public String getOriginLocationTamil() {
    return originLocationTamil;
  }

  public void setOriginLocationTamil(String originLocationTamil) {
    this.originLocationTamil = originLocationTamil;
  }

  public BigDecimal getOriginLatitude() {
    return originLatitude;
  }

  public void setOriginLatitude(BigDecimal originLatitude) {
    this.originLatitude = originLatitude;
  }

  public BigDecimal getOriginLongitude() {
    return originLongitude;
  }

  public void setOriginLongitude(BigDecimal originLongitude) {
    this.originLongitude = originLongitude;
  }

  public BoardType getBoardType() {
    return boardType;
  }

  public void setBoardType(BoardType boardType) {
    this.boardType = boardType;
  }

  public String getDescription() {
    return description;
  }

  public void setDescription(String description) {
    this.description = description;
  }

  public LocalDateTime getSubmissionDate() {
    return submissionDate;
  }

  public void setSubmissionDate(LocalDateTime submissionDate) {
    this.submissionDate = submissionDate;
  }

  public TimingImageStatus getStatus() {
    return status;
  }

  public void setStatus(TimingImageStatus status) {
    this.status = status;
  }

  public String getValidationMessage() {
    return validationMessage;
  }

  public void setValidationMessage(String validationMessage) {
    this.validationMessage = validationMessage;
  }

  public LocalDateTime getProcessedDate() {
    return processedDate;
  }

  public void setProcessedDate(LocalDateTime processedDate) {
    this.processedDate = processedDate;
  }

  public String getProcessedBy() {
    return processedBy;
  }

  public void setProcessedBy(String processedBy) {
    this.processedBy = processedBy;
  }

  public String getSubmittedBy() {
    return submittedBy;
  }

  public void setSubmittedBy(String submittedBy) {
    this.submittedBy = submittedBy;
  }

  public BigDecimal getOcrConfidence() {
    return ocrConfidence;
  }

  public void setOcrConfidence(BigDecimal ocrConfidence) {
    this.ocrConfidence = ocrConfidence;
  }

  public Boolean getRequiresManualReview() {
    return requiresManualReview;
  }

  public void setRequiresManualReview(Boolean requiresManualReview) {
    this.requiresManualReview = requiresManualReview;
  }

  public DuplicateCheckStatus getDuplicateCheckStatus() {
    return duplicateCheckStatus;
  }

  public void setDuplicateCheckStatus(DuplicateCheckStatus duplicateCheckStatus) {
    this.duplicateCheckStatus = duplicateCheckStatus;
  }

  public Integer getMergedRecords() {
    return mergedRecords;
  }

  public void setMergedRecords(Integer mergedRecords) {
    this.mergedRecords = mergedRecords;
  }

  public Integer getCreatedRecords() {
    return createdRecords;
  }

  public void setCreatedRecords(Integer createdRecords) {
    this.createdRecords = createdRecords;
  }

  public List<ExtractedBusTiming> getExtractedTimings() {
    return extractedTimings;
  }

  public void setExtractedTimings(List<ExtractedBusTiming> extractedTimings) {
    this.extractedTimings = extractedTimings;
  }

  public String getDetectedLanguage() {
    return detectedLanguage;
  }

  public void setDetectedLanguage(String detectedLanguage) {
    this.detectedLanguage = detectedLanguage;
  }

  public String getDetectedLanguages() {
    return detectedLanguages;
  }

  public void setDetectedLanguages(String detectedLanguages) {
    this.detectedLanguages = detectedLanguages;
  }

  public String getOcrTextOriginal() {
    return ocrTextOriginal;
  }

  public void setOcrTextOriginal(String ocrTextOriginal) {
    this.ocrTextOriginal = ocrTextOriginal;
  }

  public String getOcrTextEnglish() {
    return ocrTextEnglish;
  }

  public void setOcrTextEnglish(String ocrTextEnglish) {
    this.ocrTextEnglish = ocrTextEnglish;
  }

  public static class TimingImageContributionBuilder {
    private final TimingImageContribution contribution = new TimingImageContribution();

    public TimingImageContributionBuilder id(Long id) {
      contribution.setId(id);
      return this;
    }

    public TimingImageContributionBuilder userId(String userId) {
      contribution.setUserId(userId);
      return this;
    }

    public TimingImageContributionBuilder imageUrl(String imageUrl) {
      contribution.setImageUrl(imageUrl);
      return this;
    }

    public TimingImageContributionBuilder thumbnailUrl(String thumbnailUrl) {
      contribution.setThumbnailUrl(thumbnailUrl);
      return this;
    }

    public TimingImageContributionBuilder originLocation(String originLocation) {
      contribution.setOriginLocation(originLocation);
      return this;
    }

    public TimingImageContributionBuilder originLocationTamil(String originLocationTamil) {
      contribution.setOriginLocationTamil(originLocationTamil);
      return this;
    }

    public TimingImageContributionBuilder description(String description) {
      contribution.setDescription(description);
      return this;
    }

    public TimingImageContributionBuilder status(TimingImageStatus status) {
      contribution.setStatus(status);
      return this;
    }

    public TimingImageContributionBuilder submittedBy(String submittedBy) {
      contribution.setSubmittedBy(submittedBy);
      return this;
    }

    public TimingImageContribution build() {
      return contribution;
    }
  }
}
