package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.Objects;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/**
 * JPA entity for route contributions with manual implementation (no Lombok)
 */
@Entity
@Table(name = "route_contributions")
public class RouteContributionJpaEntity {
    
    @Id
    private String id;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(name = "bus_number")
    private String busNumber;
    
    @Column(name = "bus_name")
    private String busName;

    @Column(name = "from_location_name")
    private String fromLocationName;
    
    @Column(name = "to_location_name")
    private String toLocationName;
    
    @Column(name = "bus_name_secondary")
    private String busNameSecondary;

    @Column(name = "from_location_name_secondary")
    private String fromLocationNameSecondary;

    @Column(name = "to_location_name_secondary")
    private String toLocationNameSecondary;

    @Column(name = "source_language")
    private String sourceLanguage;

    @Column(name = "from_latitude")
    private Double fromLatitude;
    
    @Column(name = "from_longitude")
    private Double fromLongitude;
    
    @Column(name = "to_latitude")
    private Double toLatitude;
    
    @Column(name = "to_longitude")
    private Double toLongitude;
    
    @Column(name = "departure_time")
    private LocalDateTime departureTime;

    @Column(name = "arrival_time")
    private LocalDateTime arrivalTime;

    @Column(name = "schedule_info")
    private String scheduleInfo;
    
    @Column(name = "status")
    private String status;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor
    public RouteContributionJpaEntity() {}

    // All-args constructor
    public RouteContributionJpaEntity(String id, String userId, String busNumber, String busName,
                                    String fromLocationName, String toLocationName,
                                    String busNameSecondary, String fromLocationNameSecondary,
                                    String toLocationNameSecondary, String sourceLanguage,
                                    Double fromLatitude, Double fromLongitude,
                                    Double toLatitude, Double toLongitude,
                                    LocalDateTime departureTime, LocalDateTime arrivalTime,
                                    String scheduleInfo, String status,
                                    LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.busNumber = busNumber;
        this.busName = busName;
        this.fromLocationName = fromLocationName;
        this.toLocationName = toLocationName;
        this.busNameSecondary = busNameSecondary;
        this.fromLocationNameSecondary = fromLocationNameSecondary;
        this.toLocationNameSecondary = toLocationNameSecondary;
        this.sourceLanguage = sourceLanguage;
        this.fromLatitude = fromLatitude;
        this.fromLongitude = fromLongitude;
        this.toLatitude = toLatitude;
        this.toLongitude = toLongitude;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
        this.scheduleInfo = scheduleInfo;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters
    public String getId() { return id; }
    public String getUserId() { return userId; }
    public String getBusNumber() { return busNumber; }
    public String getBusName() { return busName; }
    public String getFromLocationName() { return fromLocationName; }
    public String getToLocationName() { return toLocationName; }
    public String getBusNameSecondary() { return busNameSecondary; }
    public String getFromLocationNameSecondary() { return fromLocationNameSecondary; }
    public String getToLocationNameSecondary() { return toLocationNameSecondary; }
    public String getSourceLanguage() { return sourceLanguage; }
    public Double getFromLatitude() { return fromLatitude; }
    public Double getFromLongitude() { return fromLongitude; }
    public Double getToLatitude() { return toLatitude; }
    public Double getToLongitude() { return toLongitude; }
    public LocalDateTime getDepartureTime() { return departureTime; }
    public LocalDateTime getArrivalTime() { return arrivalTime; }
    public String getScheduleInfo() { return scheduleInfo; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(String id) { this.id = id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }
    public void setBusName(String busName) { this.busName = busName; }
    public void setFromLocationName(String fromLocationName) { this.fromLocationName = fromLocationName; }
    public void setToLocationName(String toLocationName) { this.toLocationName = toLocationName; }
    public void setBusNameSecondary(String busNameSecondary) { this.busNameSecondary = busNameSecondary; }
    public void setFromLocationNameSecondary(String fromLocationNameSecondary) { this.fromLocationNameSecondary = fromLocationNameSecondary; }
    public void setToLocationNameSecondary(String toLocationNameSecondary) { this.toLocationNameSecondary = toLocationNameSecondary; }
    public void setSourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; }
    public void setFromLatitude(Double fromLatitude) { this.fromLatitude = fromLatitude; }
    public void setFromLongitude(Double fromLongitude) { this.fromLongitude = fromLongitude; }
    public void setToLatitude(Double toLatitude) { this.toLatitude = toLatitude; }
    public void setToLongitude(Double toLongitude) { this.toLongitude = toLongitude; }
    public void setDepartureTime(LocalDateTime departureTime) { this.departureTime = departureTime; }
    public void setArrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; }
    public void setScheduleInfo(String scheduleInfo) { this.scheduleInfo = scheduleInfo; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // equals and hashCode (based on id only)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RouteContributionJpaEntity that = (RouteContributionJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "RouteContributionJpaEntity{" +
                "id='" + id + '\'' +
                ", userId='" + userId + '\'' +
                ", busNumber='" + busNumber + '\'' +
                ", busName='" + busName + '\'' +
                ", fromLocationName='" + fromLocationName + '\'' +
                ", toLocationName='" + toLocationName + '\'' +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public Builder toBuilder() {
        return new Builder()
                .id(this.id)
                .userId(this.userId)
                .busNumber(this.busNumber)
                .busName(this.busName)
                .fromLocationName(this.fromLocationName)
                .toLocationName(this.toLocationName)
                .busNameSecondary(this.busNameSecondary)
                .fromLocationNameSecondary(this.fromLocationNameSecondary)
                .toLocationNameSecondary(this.toLocationNameSecondary)
                .sourceLanguage(this.sourceLanguage)
                .fromLatitude(this.fromLatitude)
                .fromLongitude(this.fromLongitude)
                .toLatitude(this.toLatitude)
                .toLongitude(this.toLongitude)
                .departureTime(this.departureTime)
                .arrivalTime(this.arrivalTime)
                .scheduleInfo(this.scheduleInfo)
                .status(this.status)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt);
    }

    public static class Builder {
        private String id;
        private String userId;
        private String busNumber;
        private String busName;
        private String fromLocationName;
        private String toLocationName;
        private String busNameSecondary;
        private String fromLocationNameSecondary;
        private String toLocationNameSecondary;
        private String sourceLanguage;
        private Double fromLatitude;
        private Double fromLongitude;
        private Double toLatitude;
        private Double toLongitude;
        private LocalDateTime departureTime;
        private LocalDateTime arrivalTime;
        private String scheduleInfo;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private Builder() {}

        public Builder id(String id) { this.id = id; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder busNumber(String busNumber) { this.busNumber = busNumber; return this; }
        public Builder busName(String busName) { this.busName = busName; return this; }
        public Builder fromLocationName(String fromLocationName) { this.fromLocationName = fromLocationName; return this; }
        public Builder toLocationName(String toLocationName) { this.toLocationName = toLocationName; return this; }
        public Builder busNameSecondary(String busNameSecondary) { this.busNameSecondary = busNameSecondary; return this; }
        public Builder fromLocationNameSecondary(String fromLocationNameSecondary) { this.fromLocationNameSecondary = fromLocationNameSecondary; return this; }
        public Builder toLocationNameSecondary(String toLocationNameSecondary) { this.toLocationNameSecondary = toLocationNameSecondary; return this; }
        public Builder sourceLanguage(String sourceLanguage) { this.sourceLanguage = sourceLanguage; return this; }
        public Builder fromLatitude(Double fromLatitude) { this.fromLatitude = fromLatitude; return this; }
        public Builder fromLongitude(Double fromLongitude) { this.fromLongitude = fromLongitude; return this; }
        public Builder toLatitude(Double toLatitude) { this.toLatitude = toLatitude; return this; }
        public Builder toLongitude(Double toLongitude) { this.toLongitude = toLongitude; return this; }
        public Builder departureTime(LocalDateTime departureTime) { this.departureTime = departureTime; return this; }
        public Builder arrivalTime(LocalDateTime arrivalTime) { this.arrivalTime = arrivalTime; return this; }
        public Builder scheduleInfo(String scheduleInfo) { this.scheduleInfo = scheduleInfo; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public RouteContributionJpaEntity build() {
            return new RouteContributionJpaEntity(id, userId, busNumber, busName, fromLocationName,
                    toLocationName, busNameSecondary, fromLocationNameSecondary,
                    toLocationNameSecondary, sourceLanguage, fromLatitude, fromLongitude,
                    toLatitude, toLongitude, departureTime, arrivalTime, scheduleInfo,
                    status, createdAt, updatedAt);
        }
    }
}
