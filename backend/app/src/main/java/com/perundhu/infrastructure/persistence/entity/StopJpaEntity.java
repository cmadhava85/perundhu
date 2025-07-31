package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Objects;

import com.perundhu.domain.model.Stop;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

/**
 * JPA entity for stops with manual implementation (no Lombok)
 */
@Entity
@Table(name = "stops")
public class StopJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @NotBlank(message = "Name must not be blank")
    private String name;
    
    @NotNull(message = "Arrival time must not be null")
    @Column(name = "arrival_time")
    private LocalTime arrivalTime;
    
    @NotNull(message = "Departure time must not be null")
    @Column(name = "departure_time")
    private LocalTime departureTime;
    
    @NotNull(message = "Stop order must not be null")
    @Min(value = 0, message = "Stop order must be non-negative")
    @Column(name = "stop_order")
    private Integer stopOrder;
    
    @NotNull(message = "Bus must not be null")
    @ManyToOne
    @JoinColumn(name = "bus_id")
    private BusJpaEntity bus;
    
    @NotNull(message = "Location must not be null")
    @ManyToOne
    @JoinColumn(name = "location_id")
    private LocationJpaEntity location;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor
    public StopJpaEntity() {}

    // All-args constructor
    public StopJpaEntity(Long id, String name, LocalTime arrivalTime, LocalTime departureTime,
                        Integer stopOrder, BusJpaEntity bus, LocationJpaEntity location,
                        LocalDateTime createdAt, LocalDateTime updatedAt) {
        this.id = id;
        this.name = name;
        this.arrivalTime = arrivalTime;
        this.departureTime = departureTime;
        this.stopOrder = stopOrder;
        this.bus = bus;
        this.location = location;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    public LocalTime getDepartureTime() {
        return departureTime;
    }

    public Integer getStopOrder() {
        return stopOrder;
    }

    public BusJpaEntity getBus() {
        return bus;
    }

    public LocationJpaEntity getLocation() {
        return location;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setArrivalTime(LocalTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public void setDepartureTime(LocalTime departureTime) {
        this.departureTime = departureTime;
    }

    public void setStopOrder(Integer stopOrder) {
        this.stopOrder = stopOrder;
    }

    public void setBus(BusJpaEntity bus) {
        this.bus = bus;
    }

    public void setLocation(LocationJpaEntity location) {
        this.location = location;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    // equals and hashCode (based on id only as per original @EqualsAndHashCode.Include)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        StopJpaEntity that = (StopJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // toString (excluding bus and location to avoid circular references)
    @Override
    public String toString() {
        return "StopJpaEntity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", arrivalTime=" + arrivalTime +
                ", departureTime=" + departureTime +
                ", stopOrder=" + stopOrder +
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
                .name(this.name)
                .arrivalTime(this.arrivalTime)
                .departureTime(this.departureTime)
                .stopOrder(this.stopOrder)
                .bus(this.bus)
                .location(this.location)
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt);
    }

    public static class Builder {
        private Long id;
        private String name;
        private LocalTime arrivalTime;
        private LocalTime departureTime;
        private Integer stopOrder;
        private BusJpaEntity bus;
        private LocationJpaEntity location;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;

        private Builder() {}

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
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

        public Builder bus(BusJpaEntity bus) {
            this.bus = bus;
            return this;
        }

        public Builder location(LocationJpaEntity location) {
            this.location = location;
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

        public StopJpaEntity build() {
            return new StopJpaEntity(id, name, arrivalTime, departureTime, stopOrder,
                                   bus, location, createdAt, updatedAt);
        }
    }

    public static StopJpaEntity fromDomainModel(Stop stop) {
        if (stop == null) return null;
        
        return StopJpaEntity.builder()
            .id(stop.getId().value())
            .name(stop.getName())
            .arrivalTime(stop.getArrivalTime())
            .departureTime(stop.getDepartureTime())
            .stopOrder(stop.getStopOrder())
            .bus(BusJpaEntity.builder()
                .id(stop.getBus().getId().value())
                .build())
            .location(LocationJpaEntity.builder()
                .id(stop.getLocation().getId().value())
                .build())
            .build();
    }
    
    public Stop toDomainModel() {
        try {
            return new Stop(
                new Stop.StopId(id),
                name,
                bus != null ? bus.toDomainModel() : null,
                location != null ? location.toDomainModel() : null,
                arrivalTime,
                departureTime,
                stopOrder
            );
        } catch (Exception e) {
            throw new RuntimeException("Error converting StopJpaEntity to domain model", e);
        }
    }
}

