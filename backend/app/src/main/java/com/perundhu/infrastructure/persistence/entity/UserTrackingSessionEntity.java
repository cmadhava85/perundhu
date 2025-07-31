package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.UserTrackingSession;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * JPA entity for user tracking sessions with manual implementation (no Lombok)
 */
@Entity
@Table(name = "user_tracking_sessions")
public class UserTrackingSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sessionId;
    private String userId;
    private Long busId;
    private Long startLocationId;
    private String deviceInfo;
    private String ipAddress;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String userAgent;
    private Long endLocationId;

    // Default constructor
    public UserTrackingSessionEntity() {}

    // All-args constructor
    public UserTrackingSessionEntity(Long id, String sessionId, String userId, Long busId,
                                   Long startLocationId, String deviceInfo, String ipAddress,
                                   LocalDateTime startTime, LocalDateTime endTime, String userAgent,
                                   Long endLocationId) {
        this.id = id;
        this.sessionId = sessionId;
        this.userId = userId;
        this.busId = busId;
        this.startLocationId = startLocationId;
        this.deviceInfo = deviceInfo;
        this.ipAddress = ipAddress;
        this.startTime = startTime;
        this.endTime = endTime;
        this.userAgent = userAgent;
        this.endLocationId = endLocationId;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getSessionId() {
        return sessionId;
    }

    public String getUserId() {
        return userId;
    }

    public Long getBusId() {
        return busId;
    }

    public Long getStartLocationId() {
        return startLocationId;
    }

    public String getDeviceInfo() {
        return deviceInfo;
    }

    public String getIpAddress() {
        return ipAddress;
    }

    public LocalDateTime getStartTime() {
        return startTime;
    }

    public LocalDateTime getEndTime() {
        return endTime;
    }

    public String getUserAgent() {
        return userAgent;
    }

    public Long getEndLocationId() {
        return endLocationId;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setSessionId(String sessionId) {
        this.sessionId = sessionId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public void setBusId(Long busId) {
        this.busId = busId;
    }

    public void setStartLocationId(Long startLocationId) {
        this.startLocationId = startLocationId;
    }

    public void setDeviceInfo(String deviceInfo) {
        this.deviceInfo = deviceInfo;
    }

    public void setIpAddress(String ipAddress) {
        this.ipAddress = ipAddress;
    }

    public void setStartTime(LocalDateTime startTime) {
        this.startTime = startTime;
    }

    public void setEndTime(LocalDateTime endTime) {
        this.endTime = endTime;
    }

    public void setUserAgent(String userAgent) {
        this.userAgent = userAgent;
    }

    public void setEndLocationId(Long endLocationId) {
        this.endLocationId = endLocationId;
    }

    // equals and hashCode (based on id only)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        UserTrackingSessionEntity that = (UserTrackingSessionEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "UserTrackingSessionEntity{" +
                "id=" + id +
                ", sessionId='" + sessionId + '\'' +
                ", userId='" + userId + '\'' +
                ", busId=" + busId +
                ", startLocationId=" + startLocationId +
                ", deviceInfo='" + deviceInfo + '\'' +
                ", ipAddress='" + ipAddress + '\'' +
                ", startTime=" + startTime +
                ", endTime=" + endTime +
                ", userAgent='" + userAgent + '\'' +
                ", endLocationId=" + endLocationId +
                '}';
    }

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public Builder toBuilder() {
        return new Builder()
                .id(this.id)
                .sessionId(this.sessionId)
                .userId(this.userId)
                .busId(this.busId)
                .startLocationId(this.startLocationId)
                .deviceInfo(this.deviceInfo)
                .ipAddress(this.ipAddress)
                .startTime(this.startTime)
                .endTime(this.endTime)
                .userAgent(this.userAgent)
                .endLocationId(this.endLocationId);
    }

    public static class Builder {
        private Long id;
        private String sessionId;
        private String userId;
        private Long busId;
        private Long startLocationId;
        private String deviceInfo;
        private String ipAddress;
        private LocalDateTime startTime;
        private LocalDateTime endTime;
        private String userAgent;
        private Long endLocationId;

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

        public Builder endLocationId(Long endLocationId) {
            this.endLocationId = endLocationId;
            return this;
        }

        public UserTrackingSessionEntity build() {
            return new UserTrackingSessionEntity(id, sessionId, userId, busId, startLocationId,
                                               deviceInfo, ipAddress, startTime, endTime, userAgent,
                                               endLocationId);
        }
    }

    /**
     * Convert from domain model to JPA entity
     */
    public static UserTrackingSessionEntity fromDomainModel(UserTrackingSession session) {
        return UserTrackingSessionEntity.builder()
                .id(session.id())
                .sessionId(session.sessionId())
                .userId(session.userId())
                .busId(session.busId())
                .startLocationId(session.startLocationId())
                .deviceInfo(session.deviceInfo())
                .ipAddress(session.ipAddress())
                .startTime(session.startTime())
                .endTime(session.endTime())
                .userAgent(session.userAgent())
                .endLocationId(session.endLocationId())
                .build();
    }

    /**
     * Convert from JPA entity to domain model
     */
    public UserTrackingSession toDomainModel() {
        return new UserTrackingSession(
                id,
                sessionId,
                userId,
                busId,
                startLocationId,
                deviceInfo,
                ipAddress,
                startTime,
                endTime,
                userAgent,
                endLocationId
        );
    }
}
