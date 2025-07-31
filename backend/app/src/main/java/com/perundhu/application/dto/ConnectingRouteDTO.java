package com.perundhu.application.dto;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;

/**
 * Data Transfer Object representing a connecting route between locations
 * Implemented as a Java 17 record for immutability
 */
public record ConnectingRouteDTO(
        String from,
        String to,
        LocalTime departureTime,
        LocalTime arrivalTime,
        int transfers,
        List<BusRouteSegmentDTO> segments) {
    /**
     * Creates a builder for ConnectingRouteDTO
     * Since records don't natively support the builder pattern, this provides
     * compatibility with the existing codebase that relies on builders
     *
     * @return a new Builder instance
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder record for ConnectingRouteDTO
     */
    public static final class Builder {
        private String from;
        private String to;
        private LocalTime departureTime;
        private LocalTime arrivalTime;
        private int transfers;
        private List<BusRouteSegmentDTO> segments = new ArrayList<>();

        private Builder() {}

        public Builder from(String from) {
            this.from = from;
            return this;
        }

        public Builder to(String to) {
            this.to = to;
            return this;
        }

        public Builder departureTime(LocalTime departureTime) {
            this.departureTime = departureTime;
            return this;
        }

        public Builder arrivalTime(LocalTime arrivalTime) {
            this.arrivalTime = arrivalTime;
            return this;
        }

        public Builder transfers(int transfers) {
            this.transfers = transfers;
            return this;
        }

        public Builder segments(List<BusRouteSegmentDTO> segments) {
            this.segments = segments;
            return this;
        }

        public ConnectingRouteDTO build() {
            return new ConnectingRouteDTO(from, to, departureTime, arrivalTime, transfers, segments);
        }
    }
}

