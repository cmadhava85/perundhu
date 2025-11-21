package com.perundhu.domain.model;

import java.time.LocalTime;
import java.time.LocalDateTime;

public class SkippedTimingRecord {
  private Long id;
  private Long contributionId;
  private Long fromLocationId;
  private String fromLocationName;
  private Long toLocationId;
  private String toLocationName;
  private LocalTime departureTime;
  private BusTimingRecord.TimingType timingType;
  private SkipReason skipReason;
  private Long existingRecordId;
  private BusTimingRecord.TimingSource existingRecordSource;
  private LocalDateTime skippedAt;
  private String processedBy;
  private String notes;

  public enum SkipReason {
    DUPLICATE_EXACT,
    DUPLICATE_SIMILAR,
    INVALID_TIME,
    INVALID_LOCATION
  }

  public SkippedTimingRecord() {
    this.skippedAt = LocalDateTime.now();
  }

  public static SkippedTimingRecordBuilder builder() {
    return new SkippedTimingRecordBuilder();
  }

  // Getters and Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getContributionId() {
    return contributionId;
  }

  public void setContributionId(Long contributionId) {
    this.contributionId = contributionId;
  }

  public Long getFromLocationId() {
    return fromLocationId;
  }

  public void setFromLocationId(Long fromLocationId) {
    this.fromLocationId = fromLocationId;
  }

  public String getFromLocationName() {
    return fromLocationName;
  }

  public void setFromLocationName(String fromLocationName) {
    this.fromLocationName = fromLocationName;
  }

  public Long getToLocationId() {
    return toLocationId;
  }

  public void setToLocationId(Long toLocationId) {
    this.toLocationId = toLocationId;
  }

  public String getToLocationName() {
    return toLocationName;
  }

  public void setToLocationName(String toLocationName) {
    this.toLocationName = toLocationName;
  }

  public LocalTime getDepartureTime() {
    return departureTime;
  }

  public void setDepartureTime(LocalTime departureTime) {
    this.departureTime = departureTime;
  }

  public BusTimingRecord.TimingType getTimingType() {
    return timingType;
  }

  public void setTimingType(BusTimingRecord.TimingType timingType) {
    this.timingType = timingType;
  }

  public SkipReason getSkipReason() {
    return skipReason;
  }

  public void setSkipReason(SkipReason skipReason) {
    this.skipReason = skipReason;
  }

  public Long getExistingRecordId() {
    return existingRecordId;
  }

  public void setExistingRecordId(Long existingRecordId) {
    this.existingRecordId = existingRecordId;
  }

  public BusTimingRecord.TimingSource getExistingRecordSource() {
    return existingRecordSource;
  }

  public void setExistingRecordSource(BusTimingRecord.TimingSource existingRecordSource) {
    this.existingRecordSource = existingRecordSource;
  }

  public LocalDateTime getSkippedAt() {
    return skippedAt;
  }

  public void setSkippedAt(LocalDateTime skippedAt) {
    this.skippedAt = skippedAt;
  }

  public String getProcessedBy() {
    return processedBy;
  }

  public void setProcessedBy(String processedBy) {
    this.processedBy = processedBy;
  }

  public String getNotes() {
    return notes;
  }

  public void setNotes(String notes) {
    this.notes = notes;
  }

  public static class SkippedTimingRecordBuilder {
    private final SkippedTimingRecord record = new SkippedTimingRecord();

    public SkippedTimingRecordBuilder contributionId(Long contributionId) {
      record.setContributionId(contributionId);
      return this;
    }

    public SkippedTimingRecordBuilder fromLocationId(Long fromLocationId) {
      record.setFromLocationId(fromLocationId);
      return this;
    }

    public SkippedTimingRecordBuilder fromLocationName(String fromLocationName) {
      record.setFromLocationName(fromLocationName);
      return this;
    }

    public SkippedTimingRecordBuilder toLocationId(Long toLocationId) {
      record.setToLocationId(toLocationId);
      return this;
    }

    public SkippedTimingRecordBuilder toLocationName(String toLocationName) {
      record.setToLocationName(toLocationName);
      return this;
    }

    public SkippedTimingRecordBuilder departureTime(LocalTime departureTime) {
      record.setDepartureTime(departureTime);
      return this;
    }

    public SkippedTimingRecordBuilder timingType(BusTimingRecord.TimingType timingType) {
      record.setTimingType(timingType);
      return this;
    }

    public SkippedTimingRecordBuilder skipReason(SkipReason skipReason) {
      record.setSkipReason(skipReason);
      return this;
    }

    public SkippedTimingRecordBuilder existingRecordId(Long existingRecordId) {
      record.setExistingRecordId(existingRecordId);
      return this;
    }

    public SkippedTimingRecordBuilder existingRecordSource(BusTimingRecord.TimingSource source) {
      record.setExistingRecordSource(source);
      return this;
    }

    public SkippedTimingRecordBuilder processedBy(String processedBy) {
      record.setProcessedBy(processedBy);
      return this;
    }

    public SkippedTimingRecordBuilder notes(String notes) {
      record.setNotes(notes);
      return this;
    }

    public SkippedTimingRecord build() {
      return record;
    }
  }
}
