package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.Objects;

import com.perundhu.domain.model.RouteContribution;

/**
 * JPA entity for route contributions with manual implementation (no Lombok)
 * Updated to match the RouteContribution domain model record structure
 */
@Entity
@Table(name = "route_contributions")
public class RouteContributionEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "user_id", nullable = false)
    private String userId;
    
    @Column(name = "bus_number", nullable = false)
    private String busNumber;
    
    @Column(name = "bus_name")
    private String busName;
    
    @Column(name = "from_location_name", nullable = false)
    private String fromLocationName;
    
    @Column(name = "to_location_name", nullable = false)
    private String toLocationName;
    
    @Column(name = "from_latitude")
    private Double fromLatitude;
    
    @Column(name = "from_longitude")
    private Double fromLongitude;
    
    @Column(name = "to_latitude")
    private Double toLatitude;
    
    @Column(name = "to_longitude")
    private Double toLongitude;
    
    @Column(name = "departure_time")
    private LocalTime departureTime;

    @Column(name = "arrival_time")
    private LocalTime arrivalTime;

    @Column(name = "schedule_info")
    private String scheduleInfo;

    @Column(name = "status", nullable = false)
    private String status;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor
    public RouteContributionEntity() {}

    // Simplified constructor with fewer parameters
    public RouteContributionEntity(Long id, String userId, String busNumber, String busName,
                                 String fromLocationName, String toLocationName,
                                 Double fromLatitude, Double fromLongitude,
                                 Double toLatitude, Double toLongitude,
                                 LocalTime departureTime, LocalTime arrivalTime,
                                 String scheduleInfo, String status,
                                 LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.userId = userId;
        this.busNumber = busNumber;
        this.busName = busName;
        this.fromLocationName = fromLocationName;
        this.toLocationName = toLocationName;
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
    public Long getId() { return id; }
    public String getUserId() { return userId; }
    public String getBusNumber() { return busNumber; }
    public String getBusName() { return busName; }
    public String getFromLocationName() { return fromLocationName; }
    public String getToLocationName() { return toLocationName; }
    public Double getFromLatitude() { return fromLatitude; }
    public Double getFromLongitude() { return fromLongitude; }
    public Double getToLatitude() { return toLatitude; }
    public Double getToLongitude() { return toLongitude; }
    public LocalTime getDepartureTime() { return departureTime; }
    public LocalTime getArrivalTime() { return arrivalTime; }
    public String getScheduleInfo() { return scheduleInfo; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setUserId(String userId) { this.userId = userId; }
    public void setBusNumber(String busNumber) { this.busNumber = busNumber; }
    public void setBusName(String busName) { this.busName = busName; }
    public void setFromLocationName(String fromLocationName) { this.fromLocationName = fromLocationName; }
    public void setToLocationName(String toLocationName) { this.toLocationName = toLocationName; }
    public void setFromLatitude(Double fromLatitude) { this.fromLatitude = fromLatitude; }
    public void setFromLongitude(Double fromLongitude) { this.fromLongitude = fromLongitude; }
    public void setToLatitude(Double toLatitude) { this.toLatitude = toLatitude; }
    public void setToLongitude(Double toLongitude) { this.toLongitude = toLongitude; }
    public void setDepartureTime(LocalTime departureTime) { this.departureTime = departureTime; }
    public void setArrivalTime(LocalTime arrivalTime) { this.arrivalTime = arrivalTime; }
    public void setScheduleInfo(String scheduleInfo) { this.scheduleInfo = scheduleInfo; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }

    // equals and hashCode (based on id only)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        RouteContributionEntity that = (RouteContributionEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "RouteContributionEntity{" +
                "id=" + id +
                ", userId='" + userId + '\'' +
                ", busNumber='" + busNumber + '\'' +
                ", busName='" + busName + '\'' +
                ", fromLocationName='" + fromLocationName + '\'' +
                ", toLocationName='" + toLocationName + '\'' +
                ", departureTime=" + departureTime +
                ", arrivalTime=" + arrivalTime +
                ", status='" + status + '\'' +
                ", createdAt=" + createdAt +
                ", updatedAt=" + updatedAt +
                '}';
    }

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public static class Builder {
        private Long id;
        private String userId;
        private String busNumber;
        private String busName;
        private String fromLocationName;
        private String toLocationName;
        private Double fromLatitude;
        private Double fromLongitude;
        private Double toLatitude;
        private Double toLongitude;
        private LocalTime departureTime;
        private LocalTime arrivalTime;
        private String scheduleInfo;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private Builder() {}

        public Builder id(Long id) { this.id = id; return this; }
        public Builder userId(String userId) { this.userId = userId; return this; }
        public Builder busNumber(String busNumber) { this.busNumber = busNumber; return this; }
        public Builder busName(String busName) { this.busName = busName; return this; }
        public Builder fromLocationName(String fromLocationName) { this.fromLocationName = fromLocationName; return this; }
        public Builder toLocationName(String toLocationName) { this.toLocationName = toLocationName; return this; }
        public Builder fromLatitude(Double fromLatitude) { this.fromLatitude = fromLatitude; return this; }
        public Builder fromLongitude(Double fromLongitude) { this.fromLongitude = fromLongitude; return this; }
        public Builder toLatitude(Double toLatitude) { this.toLatitude = toLatitude; return this; }
        public Builder toLongitude(Double toLongitude) { this.toLongitude = toLongitude; return this; }
        public Builder departureTime(LocalTime departureTime) { this.departureTime = departureTime; return this; }
        public Builder arrivalTime(LocalTime arrivalTime) { this.arrivalTime = arrivalTime; return this; }
        public Builder scheduleInfo(String scheduleInfo) { this.scheduleInfo = scheduleInfo; return this; }
        public Builder status(String status) { this.status = status; return this; }
        public Builder createdAt(LocalDateTime createdAt) { this.createdAt = createdAt; return this; }
        public Builder updatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public RouteContributionEntity build() {
            return new RouteContributionEntity(id, userId, busNumber, busName, fromLocationName,
                    toLocationName, fromLatitude, fromLongitude, toLatitude, toLongitude,
                    departureTime, arrivalTime, scheduleInfo, status, createdAt, updatedAt);
        }
    }

    // Simplified domain model conversion methods
    public static RouteContributionEntity fromDomainModel(RouteContribution contribution) {
        if (contribution == null) return null;

        return RouteContributionEntity.builder()
                .id(contribution.id() != null ? Long.parseLong(contribution.id().value()) : null)
                .userId(contribution.userId())
                .busNumber(contribution.busNumber())
                .busName(contribution.busName())
                .fromLocationName(contribution.fromLocationName())
                .toLocationName(contribution.toLocationName())
                .fromLatitude(contribution.fromLatitude())
                .fromLongitude(contribution.fromLongitude())
                .toLatitude(contribution.toLatitude())
                .toLongitude(contribution.toLongitude())
                .departureTime(contribution.departureTime())
                .arrivalTime(contribution.arrivalTime())
                .scheduleInfo(contribution.scheduleInfo())
                .status(contribution.status().name())
                .createdAt(LocalDateTime.now()) // Default to current time if not available
                .updatedAt(LocalDateTime.now())
                .build();
    }

    public RouteContribution toDomainModel() {
        return new RouteContribution(
                new RouteContribution.RouteContributionId(String.valueOf(id)),
                userId,
                busNumber,
                busName,
                fromLocationName,
                toLocationName,
                null, // busNameSecondary - not available in simplified entity
                null, // fromLocationNameSecondary - not available
                null, // toLocationNameSecondary - not available
                null, // sourceLanguage - not available (enum doesn't exist)
                fromLatitude,
                fromLongitude,
                toLatitude,
                toLongitude,
                departureTime,
                arrivalTime,
                scheduleInfo,
                RouteContribution.ContributionStatus.valueOf(status),
                createdAt, // submissionDate
                updatedAt, // processedDate
                null, // additionalNotes - not available
                null, // validationMessage - not available
                new java.util.ArrayList<>() // Empty stops list
        );
    }
}
