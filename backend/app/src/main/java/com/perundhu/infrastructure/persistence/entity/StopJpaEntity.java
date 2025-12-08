package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.Objects;
import java.util.List;

import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.StopId;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
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
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    private BusJpaEntity bus;

    @NotNull(message = "Location must not be null")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "location_id")
    private LocationJpaEntity location;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Default constructor
    public StopJpaEntity() {
    }

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

    // equals and hashCode (based on id only as per original
    // @EqualsAndHashCode.Include)
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
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

        private Builder() {
        }

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
        if (stop == null)
            return null;

        StopJpaEntity entity = new StopJpaEntity();
        if (stop.id() != null) {
            entity.setId(stop.id().value());
        }
        entity.setName(stop.name());
        entity.setArrivalTime(stop.arrivalTime());
        entity.setDepartureTime(stop.departureTime());
        entity.setStopOrder(stop.sequence());

        // Note: Stop domain model doesn't have bus field anymore
        // entity.setBus would need to be set separately

        if (stop.location() != null && stop.location().id() != null) {
            LocationJpaEntity locationEntity = new LocationJpaEntity();
            locationEntity.setId(stop.location().id().value());
            entity.setLocation(locationEntity);
        }

        return entity;
    }

    public Stop toDomainModel() {
        try {
            // First check if we have a valid location
            Location locationModel = null;
            if (location != null) {
                try {
                    if (location.getId() != null) {
                        locationModel = location.toDomainModel();
                    } else {
                        // Create a minimal valid location if ID is missing
                        Double lat = location.getLatitude();
                        Double lng = location.getLongitude();
                        // Create a minimal valid location
                        locationModel = new Location(
                                null,
                                location.getName() != null ? location.getName() : "Unknown Location",
                                null, // nameLocalLanguage
                                lat != null ? lat : 0.0,
                                lng != null ? lng : 0.0);
                    }
                } catch (Exception e) {
                    // Log the error but don't fail the entire conversion
                    System.err.println("Error converting location: " + e.getMessage());
                    // Create a default location
                    locationModel = new Location(null, "Unknown Location", null, 0.0, 0.0);
                }
            }

            // Create Bus domain model with careful null handling
            Bus busModel = null;
            if (bus != null) {
                try {
                    busModel = bus.toDomainModel();
                } catch (Exception e) {
                    // Log the error but don't fail the entire conversion
                    System.err.println("Error converting bus: " + e.getMessage());
                }
            }

            Integer stopOrderValue = stopOrder;
            return new Stop(
                    id != null ? new StopId(id) : null,
                    name != null ? name : "Unknown Stop",
                    locationModel,
                    arrivalTime,
                    departureTime,
                    stopOrderValue != null ? stopOrderValue : 0,
                    List.of() // features - not stored in JPA entity
            );
        } catch (Exception e) {
            throw new RuntimeException("Error converting StopJpaEntity to domain model", e);
        }
    }
}
