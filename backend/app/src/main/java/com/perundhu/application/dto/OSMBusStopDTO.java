package com.perundhu.application.dto;

/**
 * DTO for OSM Bus Stop information using Java 17 record
 */
public record OSMBusStopDTO(
    Long osmId,
    String name,
    Double latitude,
    Double longitude,
    String stopType,
    String network,
    String operator,
    Boolean hasShelter,
    Boolean hasBench,
    String wheelchair,
    Double relevanceScore) {
  /**
   * Factory method for backward compatibility
   */
  public static Builder builder() {
    return new Builder();
  }

  /**
   * Builder class for backward compatibility
   */
  public static class Builder {
    private Long osmId;
    private String name;
    private Double latitude;
    private Double longitude;
    private String stopType;
    private String network;
    private String operator;
    private Boolean hasShelter;
    private Boolean hasBench;
    private String wheelchair;
    private Double relevanceScore;

    public Builder osmId(Long osmId) {
      this.osmId = osmId;
      return this;
    }

    public Builder name(String name) {
      this.name = name;
      return this;
    }

    public Builder latitude(Double latitude) {
      this.latitude = latitude;
      return this;
    }

    public Builder longitude(Double longitude) {
      this.longitude = longitude;
      return this;
    }

    public Builder stopType(String stopType) {
      this.stopType = stopType;
      return this;
    }

    public Builder network(String network) {
      this.network = network;
      return this;
    }

    public Builder operator(String operator) {
      this.operator = operator;
      return this;
    }

    public Builder hasShelter(Boolean hasShelter) {
      this.hasShelter = hasShelter;
      return this;
    }

    public Builder hasBench(Boolean hasBench) {
      this.hasBench = hasBench;
      return this;
    }

    public Builder wheelchair(String wheelchair) {
      this.wheelchair = wheelchair;
      return this;
    }

    public Builder relevanceScore(Double relevanceScore) {
      this.relevanceScore = relevanceScore;
      return this;
    }

    public OSMBusStopDTO build() {
      return new OSMBusStopDTO(osmId, name, latitude, longitude, stopType,
          network, operator, hasShelter, hasBench, wheelchair, relevanceScore);
    }
  }
}