package com.perundhu.domain.model;

/**
 * Domain model for stop contributions within a route contribution
 * Java 17 compatible mutable class version for OCR service compatibility
 */
public class StopContribution {
    private String name;
    private String translatedName; // Translation in user's preferred language
    private String taName; // Tamil name for the stop
    private Double latitude;
    private Double longitude;
    private String arrivalTime;
    private String departureTime;
    private Integer stopOrder;

    // Default constructor
    public StopContribution() {
    }

    // Full constructor
    public StopContribution(String name, String translatedName, String taName, Double latitude, Double longitude,
            String arrivalTime, String departureTime, Integer stopOrder) {
        this.name = name;
        this.translatedName = translatedName;
        this.taName = taName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.arrivalTime = arrivalTime;
        this.departureTime = departureTime;
        this.stopOrder = stopOrder;

        validateCoordinates();
    }

    // Backward compatible constructor (without translation fields)
    public StopContribution(String name, Double latitude, Double longitude,
            String arrivalTime, String departureTime, Integer stopOrder) {
        this(name, null, null, latitude, longitude, arrivalTime, departureTime, stopOrder);
    }

    // Validation method
    private void validateCoordinates() {
        if (latitude != null && (latitude < -90.0 || latitude > 90.0)) {
            throw new IllegalArgumentException("Latitude must be between -90 and 90");
        }
        if (longitude != null && (longitude < -180.0 || longitude > 180.0)) {
            throw new IllegalArgumentException("Longitude must be between -180 and 180");
        }
        if (stopOrder != null && stopOrder < 0) {
            throw new IllegalArgumentException("Stop order must be non-negative");
        }
    }

    // Getters and setters
    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getTranslatedName() {
        return translatedName;
    }

    public void setTranslatedName(String translatedName) {
        this.translatedName = translatedName;
    }

    public String getTaName() {
        return taName;
    }

    public void setTaName(String taName) {
        this.taName = taName;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
        validateCoordinates();
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
        validateCoordinates();
    }

    public String getArrivalTime() {
        return arrivalTime;
    }

    public void setArrivalTime(String arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public String getDepartureTime() {
        return departureTime;
    }

    public void setDepartureTime(String departureTime) {
        this.departureTime = departureTime;
    }

    public Integer getStopOrder() {
        return stopOrder;
    }

    public void setStopOrder(Integer stopOrder) {
        this.stopOrder = stopOrder;
        validateCoordinates();
    }

    // Factory method for backward compatibility with builder pattern
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private String name;
        private String translatedName;
        private String taName;
        private Double latitude;
        private Double longitude;
        private String arrivalTime;
        private String departureTime;
        private Integer stopOrder;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder translatedName(String translatedName) {
            this.translatedName = translatedName;
            return this;
        }

        public Builder taName(String taName) {
            this.taName = taName;
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

        public Builder arrivalTime(String arrivalTime) {
            this.arrivalTime = arrivalTime;
            return this;
        }

        public Builder departureTime(String departureTime) {
            this.departureTime = departureTime;
            return this;
        }

        public Builder stopOrder(Integer stopOrder) {
            this.stopOrder = stopOrder;
            return this;
        }

        public StopContribution build() {
            return new StopContribution(name, translatedName, taName, latitude, longitude, arrivalTime, departureTime, stopOrder);
        }
    }

    @Override
    public String toString() {
        return "StopContribution{" +
                "name='" + name + '\'' +
                ", translatedName='" + translatedName + '\'' +
                ", taName='" + taName + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                ", arrivalTime='" + arrivalTime + '\'' +
                ", departureTime='" + departureTime + '\'' +
                ", stopOrder=" + stopOrder +
                '}';
    }
}