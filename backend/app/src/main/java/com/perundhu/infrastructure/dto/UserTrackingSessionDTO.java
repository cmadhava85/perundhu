package com.perundhu.infrastructure.dto;

import java.time.LocalDateTime;

/**
 * Data Transfer Object for user tracking sessions
 * Implemented as a Java 17 record for immutability
 */
public record UserTrackingSessionDTO(
        Long id,
        String sessionId,
        String userId,
        Long busId,
        Long startLocationId,
        Long endLocationId,
        String deviceInfo,
        String ipAddress,
        LocalDateTime startTime,
        LocalDateTime endTime,
        String userAgent) {
    /**
     * Creates a builder for UserTrackingSessionDTO
     * Since Java 17 records don't natively support the builder pattern, this
     * provides backward compatibility
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for UserTrackingSessionDTO
     */
    public static final class Builder {
        private Long id;
        private String sessionId;
        private String userId;
        private Long busId;
        private Long startLocationId;
        private Long endLocationId;
        private String deviceInfo;
        private String ipAddress;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String userAgent;

        private Builder() {}

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder sessionId(String sessionId) {
            this.sessionId = sessionId;
            return this;
        }

        public Builder userId(String userId) {
            this.userId = userId;
            return this;
        }

        public Builder busId(Long busId) {
            this.busId = busId;
            return this;
        }

        public Builder startLocationId(Long startLocationId) {
            this.startLocationId = startLocationId;
            return this;
        }

        public Builder endLocationId(Long endLocationId) {
            this.endLocationId = endLocationId;
            return this;
        }

        public Builder deviceInfo(String deviceInfo) {
            this.deviceInfo = deviceInfo;
            return this;
        }

        public Builder ipAddress(String ipAddress) {
            this.ipAddress = ipAddress;
            return this;
        }

        public Builder startTime(LocalDateTime startTime) {
            this.startTime = startTime;
            return this;
        }

        public Builder endTime(LocalDateTime endTime) {
            this.endTime = endTime;
            return this;
        }

        public Builder userAgent(String userAgent) {
            this.userAgent = userAgent;
            return this;
        }

        public UserTrackingSessionDTO build() {
            return new UserTrackingSessionDTO(
                    id, sessionId, userId, busId, startLocationId,
                    endLocationId, deviceInfo, ipAddress, startTime,
                    endTime, userAgent);
        }
    }
}

