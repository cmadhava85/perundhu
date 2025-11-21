package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.time.LocalTime;

public class BusTimingRecord {
  private Long id;
  private Long busId;
  private Long fromLocationId;
  private String fromLocationName;
  private Long toLocationId;
  private String toLocationName;
  private LocalTime departureTime;
  private LocalTime arrivalTime;
  private TimingType timingType;
  private TimingSource source;
  private Long contributionId;
  private Boolean verified;
  private LocalDateTime lastUpdated;

  public enum TimingType {
    MORNING, AFTERNOON, NIGHT
  }

  public enum TimingSource {
    USER_CONTRIBUTION, OFFICIAL, OCR_EXTRACTED
  }

  public BusTimingRecord() {
    this.verified = false;
    this.source = TimingSource.OCR_EXTRACTED;
    this.lastUpdated = LocalDateTime.now();
  }

  public static BusTimingRecordBuilder builder() {
    return new BusTimingRecordBuilder();
  }

  // Getters and Setters
  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public Long getBusId() {
    return busId;
  }

  public void setBusId(Long busId) {
    this.busId = busId;
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

  public LocalTime getArrivalTime() {
    return arrivalTime;
  }

  public void setArrivalTime(LocalTime arrivalTime) {
    this.arrivalTime = arrivalTime;
  }

  public TimingType getTimingType() {
    return timingType;
  }

  public void setTimingType(TimingType timingType) {
    this.timingType = timingType;
  }

  public TimingSource getSource() {
    return source;
  }

  public void setSource(TimingSource source) {
    this.source = source;
  }

  public Long getContributionId() {
    return contributionId;
  }

  public void setContributionId(Long contributionId) {
    this.contributionId = contributionId;
  }

  public Boolean getVerified() {
    return verified;
  }

  public void setVerified(Boolean verified) {
    this.verified = verified;
  }

  public LocalDateTime getLastUpdated() {
    return lastUpdated;
  }

  public void setLastUpdated(LocalDateTime lastUpdated) {
    this.lastUpdated = lastUpdated;
  }

  public static class BusTimingRecordBuilder {
    private final BusTimingRecord record = new BusTimingRecord();

    public BusTimingRecordBuilder fromLocationId(Long fromLocationId) {
      record.setFromLocationId(fromLocationId);
      return this;
    }

    public BusTimingRecordBuilder fromLocationName(String fromLocationName) {
      record.setFromLocationName(fromLocationName);
      return this;
    }

    public BusTimingRecordBuilder toLocationId(Long toLocationId) {
      record.setToLocationId(toLocationId);
      return this;
    }

    public BusTimingRecordBuilder toLocationName(String toLocationName) {
      record.setToLocationName(toLocationName);
      return this;
    }

    public BusTimingRecordBuilder departureTime(LocalTime departureTime) {
      record.setDepartureTime(departureTime);
      return this;
    }

    public BusTimingRecordBuilder timingType(TimingType timingType) {
      record.setTimingType(timingType);
      return this;
    }

    public BusTimingRecordBuilder source(TimingSource source) {
      record.setSource(source);
      return this;
    }

    public BusTimingRecordBuilder contributionId(Long contributionId) {
      record.setContributionId(contributionId);
      return this;
    }

    public BusTimingRecord build() {
      return record;
    }
  }
}
