package com.perundhu.application.dto;

import java.time.LocalTime;

/**
 * DTO for Stop information using Java 17 record
 * Converted from Lombok @Value to native Java 17 features
 */
public record StopDTO(
        String name,
        String translatedName,
        LocalTime arrivalTime,
        LocalTime departureTime,
        Integer stopOrder,
        Double latitude,
        Double longitude) {
    /**
     * Factory method for backward compatibility with builder pattern
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for backward compatibility
     */
    public static class Builder {
        private String name;
        private String translatedName;
        private LocalTime arrivalTime;
        private LocalTime departureTime;
        private Integer stopOrder;
        private Double latitude;
        private Double longitude;

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder translatedName(String translatedName) {
            this.translatedName = translatedName;
            return this;
        }

        public Builder arrivalTime(LocalTime arrivalTime) {
            this.arrivalTime = arrivalTime;
            return this;
        }

        public Builder departureTime(LocalTime departureTime) {
            this.departureTime = departureTime;
            return this;
        }

        public Builder stopOrder(Integer stopOrder) {
            this.stopOrder = stopOrder;
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

        public StopDTO build() {
            return new StopDTO(name, translatedName, arrivalTime, departureTime,
                    stopOrder, latitude, longitude);
        }
    }
}