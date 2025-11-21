package com.perundhu.domain.model;

import java.util.ArrayList;
import java.util.List;

public class ExtractedBusTiming {
  private Long id;
  private Long contributionId;
  private String destination;
  private String destinationTamil;
  private List<String> morningTimings;
  private List<String> afternoonTimings;
  private List<String> nightTimings;

  public ExtractedBusTiming() {
    this.morningTimings = new ArrayList<>();
    this.afternoonTimings = new ArrayList<>();
    this.nightTimings = new ArrayList<>();
  }

  public static ExtractedBusTimingBuilder builder() {
    return new ExtractedBusTimingBuilder();
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

  public String getDestination() {
    return destination;
  }

  public void setDestination(String destination) {
    this.destination = destination;
  }

  public String getDestinationTamil() {
    return destinationTamil;
  }

  public void setDestinationTamil(String destinationTamil) {
    this.destinationTamil = destinationTamil;
  }

  public List<String> getMorningTimings() {
    return morningTimings;
  }

  public void setMorningTimings(List<String> morningTimings) {
    this.morningTimings = morningTimings;
  }

  public List<String> getAfternoonTimings() {
    return afternoonTimings;
  }

  public void setAfternoonTimings(List<String> afternoonTimings) {
    this.afternoonTimings = afternoonTimings;
  }

  public List<String> getNightTimings() {
    return nightTimings;
  }

  public void setNightTimings(List<String> nightTimings) {
    this.nightTimings = nightTimings;
  }

  public static class ExtractedBusTimingBuilder {
    private final ExtractedBusTiming timing = new ExtractedBusTiming();

    public ExtractedBusTimingBuilder id(Long id) {
      timing.setId(id);
      return this;
    }

    public ExtractedBusTimingBuilder contributionId(Long contributionId) {
      timing.setContributionId(contributionId);
      return this;
    }

    public ExtractedBusTimingBuilder destination(String destination) {
      timing.setDestination(destination);
      return this;
    }

    public ExtractedBusTimingBuilder destinationTamil(String destinationTamil) {
      timing.setDestinationTamil(destinationTamil);
      return this;
    }

    public ExtractedBusTimingBuilder morningTimings(List<String> morningTimings) {
      timing.setMorningTimings(morningTimings);
      return this;
    }

    public ExtractedBusTimingBuilder afternoonTimings(List<String> afternoonTimings) {
      timing.setAfternoonTimings(afternoonTimings);
      return this;
    }

    public ExtractedBusTimingBuilder nightTimings(List<String> nightTimings) {
      timing.setNightTimings(nightTimings);
      return this;
    }

    public ExtractedBusTiming build() {
      return timing;
    }
  }
}
