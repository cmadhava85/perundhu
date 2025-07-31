package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.Objects;

import com.perundhu.domain.model.BusAnalytics;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

/**
 * JPA entity for bus analytics with manual implementation (no Lombok)
 */
@Entity
@Table(name = "bus_analytics")
public class BusAnalyticsJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    @NotNull(message = "Bus must not be null")
    private BusJpaEntity bus;

    @Column(name = "date", nullable = false)
    @NotNull(message = "Date must not be null")
    private LocalDateTime date;

    @Column(name = "passenger_count")
    private Integer passengerCount;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(name = "average_speed")
    private Double averageSpeed;

    @Column(name = "total_trips")
    private Integer totalTrips;

    @Column(name = "on_time_performance")
    private Double onTimePerformance;

    @Column(name = "average_occupancy")
    private Double averageOccupancy;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor
    public BusAnalyticsJpaEntity() {}

    // All-args constructor
    public BusAnalyticsJpaEntity(UUID id, BusJpaEntity bus, LocalDateTime date,
                                Integer passengerCount, Integer delayMinutes,
                                Double averageSpeed, Integer totalTrips,
                                Double onTimePerformance, Double averageOccupancy,
                                LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.bus = bus;
        this.date = date;
        this.passengerCount = passengerCount;
        this.delayMinutes = delayMinutes;
        this.averageSpeed = averageSpeed;
        this.totalTrips = totalTrips;
        this.onTimePerformance = onTimePerformance;
        this.averageOccupancy = averageOccupancy;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters
    public UUID getId() {
        return id;
    }

    public BusJpaEntity getBus() {
        return bus;
    }

    public LocalDateTime getDate() {
        return date;
    }

    public Integer getPassengerCount() {
        return passengerCount;
    }

    public Integer getDelayMinutes() {
        return delayMinutes;
    }

    public Double getAverageSpeed() {
        return averageSpeed;
    }

    public Integer getTotalTrips() {
        return totalTrips;
    }

    public Double getOnTimePerformance() {
        return onTimePerformance;
    }

    public Double getAverageOccupancy() {
        return averageOccupancy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setters
    public void setId(UUID id) {
        this.id = id;
    }

    public void setBus(BusJpaEntity bus) {
        this.bus = bus;
    }

    public void setDate(LocalDateTime date) {
        this.date = date;
    }

    public void setPassengerCount(Integer passengerCount) {
        this.passengerCount = passengerCount;
    }

    public void setDelayMinutes(Integer delayMinutes) {
        this.delayMinutes = delayMinutes;
    }

    public void setAverageSpeed(Double averageSpeed) {
        this.averageSpeed = averageSpeed;
    }

    public void setTotalTrips(Integer totalTrips) {
        this.totalTrips = totalTrips;
    }

    public void setOnTimePerformance(Double onTimePerformance) {
        this.onTimePerformance = onTimePerformance;
    }

    public void setAverageOccupancy(Double averageOccupancy) {
        this.averageOccupancy = averageOccupancy;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // equals and hashCode (based on id only)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BusAnalyticsJpaEntity that = (BusAnalyticsJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "BusAnalyticsJpaEntity{" +
                "id=" + id +
                ", date=" + date +
                ", passengerCount=" + passengerCount +
                ", delayMinutes=" + delayMinutes +
                ", averageSpeed=" + averageSpeed +
                ", totalTrips=" + totalTrips +
                ", onTimePerformance=" + onTimePerformance +
                ", averageOccupancy=" + averageOccupancy +
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
                .bus(this.bus)
                .date(this.date)
                .passengerCount(this.passengerCount)
                .delayMinutes(this.delayMinutes)
                .averageSpeed(this.averageSpeed)
                .totalTrips(this.totalTrips)
                .onTimePerformance(this.onTimePerformance)
                .averageOccupancy(this.averageOccupancy)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt);
    }

    public static class Builder {
        private UUID id;
        private BusJpaEntity bus;
        private LocalDateTime date;
        private Integer passengerCount;
        private Integer delayMinutes;
        private Double averageSpeed;
        private Integer totalTrips;
        private Double onTimePerformance;
        private Double averageOccupancy;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private Builder() {}

        public Builder id(UUID id) {
            this.id = id;
            return this;
        }

        public Builder bus(BusJpaEntity bus) {
            this.bus = bus;
            return this;
        }

        public Builder date(LocalDateTime date) {
            this.date = date;
            return this;
        }

        public Builder passengerCount(Integer passengerCount) {
            this.passengerCount = passengerCount;
            return this;
        }

        public Builder delayMinutes(Integer delayMinutes) {
            this.delayMinutes = delayMinutes;
            return this;
        }

        public Builder averageSpeed(Double averageSpeed) {
            this.averageSpeed = averageSpeed;
            return this;
        }

        public Builder totalTrips(Integer totalTrips) {
            this.totalTrips = totalTrips;
            return this;
        }

        public Builder onTimePerformance(Double onTimePerformance) {
            this.onTimePerformance = onTimePerformance;
            return this;
        }

        public Builder averageOccupancy(Double averageOccupancy) {
            this.averageOccupancy = averageOccupancy;
            return this;
        }

        public Builder createdAt(LocalDateTime createdAt) {
            this.createdAt = createdAt;
            return this;
        }

        public Builder updatedAt(LocalDateTime updatedAt) {
            this.updatedAt = updatedAt;
            return this;
        }

        public BusAnalyticsJpaEntity build() {
            return new BusAnalyticsJpaEntity(id, bus, date, passengerCount, delayMinutes,
                                           averageSpeed, totalTrips, onTimePerformance,
                                           averageOccupancy, createdAt, updatedAt);
        }
    }

    public static BusAnalyticsJpaEntity fromDomainModel(BusAnalytics analytics) {
        if (analytics == null) return null;

        return BusAnalyticsJpaEntity.builder()
            .id(analytics.id() != null ? analytics.id().value() : null)
            .bus(analytics.bus() != null ? BusJpaEntity.fromDomainModel(analytics.bus()) : null)
            .date(analytics.date() != null ? analytics.date().atStartOfDay() : null)
            .passengerCount(analytics.totalPassengers())
            .delayMinutes(analytics.averageDelay() != null ? analytics.averageDelay().intValue() : null)
            .averageSpeed(analytics.averageSpeed())
            .totalTrips(analytics.totalTrips())
            .onTimePerformance(analytics.onTimePerformance())
            .averageOccupancy(analytics.averageOccupancy())
            .createdAt(analytics.createdAt())
            .updatedAt(analytics.updatedAt())
            .build();
    }

    public BusAnalytics toDomainModel() {
        return new BusAnalytics(
            new BusAnalytics.BusAnalyticsId(id),
            bus != null ? bus.toDomainModel() : null,
            date != null ? date.toLocalDate() : null,
            passengerCount,
            delayMinutes != null ? delayMinutes.doubleValue() : null,
            averageSpeed,
            totalTrips,
            onTimePerformance,
            averageOccupancy,
            createdAt,
            updatedAt
        );
    }
}
