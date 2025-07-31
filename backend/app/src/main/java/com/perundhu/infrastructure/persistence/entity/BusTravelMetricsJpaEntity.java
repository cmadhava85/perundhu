package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Objects;

import com.perundhu.domain.model.BusTravelMetrics;
import com.perundhu.domain.model.Location;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

/**
 * JPA entity for bus travel metrics with manual implementation (no Lombok)
 */
@Entity
@Table(name = "bus_travel_metrics")
public class BusTravelMetricsJpaEntity {
    
    @Id
    @Column(name = "id")
    private UUID id;
    
    @NotNull(message = "Bus must not be null")
    @ManyToOne
    @JoinColumn(name = "bus_id", referencedColumnName = "id")
    private BusJpaEntity bus;
    
    @ManyToOne
    @JoinColumn(name = "from_location_id", referencedColumnName = "id")
    private LocationJpaEntity fromLocation;

    @ManyToOne
    @JoinColumn(name = "to_location_id", referencedColumnName = "id")
    private LocationJpaEntity toLocation;

    @NotNull(message = "Timestamp must not be null")
    @Column(name = "timestamp")
    private LocalDateTime timestamp;
    
    @Min(value = 0, message = "Speed must be non-negative")
    @Column(name = "speed")
    private Double speed;
    
    @Min(value = 0, message = "Occupancy must be non-negative")
    @Column(name = "occupancy")
    private Integer occupancy;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes;
    
    @Column(name = "is_on_time")
    private Boolean isOnTime;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "passenger_count")
    private Integer passengerCount;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    // Default constructor
    public BusTravelMetricsJpaEntity() {}

    // All-args constructor
    public BusTravelMetricsJpaEntity(UUID id, BusJpaEntity bus, LocationJpaEntity fromLocation, LocationJpaEntity toLocation,
                                   LocalDateTime timestamp, Double speed, Integer occupancy, Integer delayMinutes,
                                   Boolean isOnTime, Integer durationMinutes, Integer passengerCount, LocalDateTime createdAt) {
        this.id = id;
        this.bus = bus;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.timestamp = timestamp;
        this.speed = speed;
        this.occupancy = occupancy;
        this.delayMinutes = delayMinutes;
        this.isOnTime = isOnTime;
        this.durationMinutes = durationMinutes;
        this.passengerCount = passengerCount;
        this.createdAt = createdAt;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public BusJpaEntity getBus() {
        return bus;
    }

    public LocationJpaEntity getFromLocation() {
        return fromLocation;
    }

    public LocationJpaEntity getToLocation() {
        return toLocation;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public Double getSpeed() {
        return speed;
    }

    public Integer getOccupancy() {
        return occupancy;
    }

    public Integer getDelayMinutes() {
        return delayMinutes;
    }

    public Boolean getIsOnTime() {
        return isOnTime;
    }

    public Integer getDurationMinutes() {
        return durationMinutes;
    }

    public Integer getPassengerCount() {
        return passengerCount;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    // Setters
    public void setId(UUID id) {
        this.id = id;
    }

    public void setBus(BusJpaEntity bus) {
        this.bus = bus;
    }

    public void setFromLocation(LocationJpaEntity fromLocation) {
        this.fromLocation = fromLocation;
    }

    public void setToLocation(LocationJpaEntity toLocation) {
        this.toLocation = toLocation;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public void setSpeed(Double speed) {
        this.speed = speed;
    }

    public void setOccupancy(Integer occupancy) {
        this.occupancy = occupancy;
    }

    public void setDelayMinutes(Integer delayMinutes) {
        this.delayMinutes = delayMinutes;
    }

    public void setIsOnTime(Boolean isOnTime) {
        this.isOnTime = isOnTime;
    }

    public void setDurationMinutes(Integer durationMinutes) {
        this.durationMinutes = durationMinutes;
    }

    public void setPassengerCount(Integer passengerCount) {
        this.passengerCount = passengerCount;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    // equals and hashCode (based on id only)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BusTravelMetricsJpaEntity that = (BusTravelMetricsJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "BusTravelMetricsJpaEntity{" +
                "id=" + id +
                ", fromLocation=" + fromLocation +
                ", toLocation=" + toLocation +
                ", timestamp=" + timestamp +
                ", speed=" + speed +
                ", occupancy=" + occupancy +
                ", delayMinutes=" + delayMinutes +
                ", isOnTime=" + isOnTime +
                ", durationMinutes=" + durationMinutes +
                ", passengerCount=" + passengerCount +
                ", createdAt=" + createdAt +
                '}';
    }

    // Builder pattern implementation
    public static Builder builder() {
        return new Builder();
    }

    public Builder toBuilder() {
        return new Builder()
                .id(this.id)
                .bus(this.bus)
                .fromLocation(this.fromLocation)
                .toLocation(this.toLocation)
                .timestamp(this.timestamp)
                .speed(this.speed)
                .occupancy(this.occupancy)
                .delayMinutes(this.delayMinutes)
                .isOnTime(this.isOnTime)
                .durationMinutes(this.durationMinutes)
                .passengerCount(this.passengerCount)
                .createdAt(this.createdAt);
    }

    public static class Builder {
        private UUID id;
        private BusJpaEntity bus;
        private LocationJpaEntity fromLocation;
        private LocationJpaEntity toLocation;
        private LocalDateTime timestamp;
        private Double speed;
        private Integer occupancy;
        private Integer delayMinutes;
        private Boolean isOnTime;
        private Integer durationMinutes;
        private Integer passengerCount;
        private LocalDateTime createdAt;

        private Builder() {}

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder bus(BusJpaEntity bus) {
            this.bus = bus;
            return this;
        }

        public Builder fromLocation(LocationJpaEntity fromLocation) {
            this.fromLocation = fromLocation;
            return this;
        }

        public Builder toLocation(LocationJpaEntity toLocation) {
            this.toLocation = toLocation;
            return this;
        }

        public Builder timestamp(LocalDateTime timestamp) {
            this.timestamp = timestamp;
            return this;
        }

        public Builder speed(Double speed) {
            this.speed = speed;
            return this;
        }

        public Builder occupancy(Integer occupancy) {
            this.occupancy = occupancy;
            return this;
        }

        public Builder delayMinutes(Integer delayMinutes) {
            this.delayMinutes = delayMinutes;
            return this;
        }

        public Builder isOnTime(Boolean isOnTime) {
            this.isOnTime = isOnTime;
            return this;
        }

        public Builder durationMinutes(Integer durationMinutes) {
            this.durationMinutes = durationMinutes;
            return this;
        }

        public Builder passengerCount(Integer passengerCount) {
            this.passengerCount = passengerCount;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public BusTravelMetricsJpaEntity build() {
            return new BusTravelMetricsJpaEntity(id, bus, fromLocation, toLocation, timestamp, speed, occupancy,
                                               delayMinutes, isOnTime, durationMinutes, passengerCount, createdAt);
        }
    }

    // Domain model conversion methods
    public static BusTravelMetricsJpaEntity fromDomainModel(BusTravelMetrics metrics) {
        if (metrics == null) return null;

        return BusTravelMetricsJpaEntity.builder()
                .id(metrics.id() != null ? metrics.id().value() : null)
                .bus(metrics.bus() != null ? BusJpaEntity.fromDomainModel(metrics.bus()) : null)
                .fromLocation(metrics.fromLocation() != null ? LocationJpaEntity.fromDomainModel(metrics.fromLocation()) : null)
                .toLocation(metrics.toLocation() != null ? LocationJpaEntity.fromDomainModel(metrics.toLocation()) : null)
                .timestamp(metrics.timestamp())
                .speed(metrics.speed())
                .occupancy(metrics.occupancy())
                .delayMinutes(metrics.delayMinutes())
                .isOnTime(metrics.isOnTime())
                .durationMinutes(metrics.durationMinutes())
                .passengerCount(metrics.passengerCount())
                .createdAt(metrics.createdAt())
                .build();
    }

    public BusTravelMetrics toDomainModel() {
        return new BusTravelMetrics(
                new BusTravelMetrics.BusTravelMetricsId(id),
                bus != null ? bus.toDomainModel() : null,
                fromLocation != null ? fromLocation.toDomainModel() : null,
                toLocation != null ? toLocation.toDomainModel() : null,
                timestamp,
                speed,
                occupancy,
                delayMinutes,
                isOnTime,
                durationMinutes,
                passengerCount,
                createdAt
        );
    }
}

