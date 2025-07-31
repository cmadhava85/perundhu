package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.perundhu.domain.model.BusLocationHistory;
import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

/**
 * JPA entity for bus location history converted to use Java 17 features instead of Lombok
 */
@Entity
@Table(name = "bus_location_history")
public class BusLocationHistoryJpaEntity {

    @Id
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "bus_id", nullable = false)
    private BusJpaEntity bus;

    @NotNull
    @Min(-90)
    @Max(90)
    private double latitude;

    @NotNull
    @Min(-180)
    @Max(180)
    private double longitude;

    @NotNull
    private LocalDateTime timestamp;

    @Min(0)
    private double speed;

    @Min(0)
    @Max(360)
    private double heading;

    // Default constructor for JPA
    public BusLocationHistoryJpaEntity() {
    }

    // Constructor with all fields
    public BusLocationHistoryJpaEntity(UUID id, BusJpaEntity bus, double latitude, double longitude,
                                     LocalDateTime timestamp, double speed, double heading) {
        this.id = id;
        this.bus = bus;
        this.latitude = latitude;
        this.longitude = longitude;
        this.timestamp = timestamp;
        this.speed = speed;
        this.heading = heading;
    }

    // Getters and setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public BusJpaEntity getBus() {
        return bus;
    }

    public void setBus(BusJpaEntity bus) {
        this.bus = bus;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public double getSpeed() {
        return speed;
    }

    public void setSpeed(double speed) {
        this.speed = speed;
    }

    public double getHeading() {
        return heading;
    }

    public void setHeading(double heading) {
        this.heading = heading;
    }

    public static BusLocationHistoryJpaEntity fromDomainModel(BusLocationHistory history) {
        if (history == null) return null;

        BusJpaEntity busEntity = BusJpaEntity.builder()
            .id(history.bus().id().value())
            .build();

        BusLocationHistoryJpaEntity entity = new BusLocationHistoryJpaEntity();
        entity.setId(history.id().value());
        entity.setBus(busEntity);
        entity.setLatitude(history.location().latitude());
        entity.setLongitude(history.location().longitude());
        entity.setTimestamp(history.timestamp());
        entity.setSpeed(history.speed() != null ? history.speed() : 0.0);
        entity.setHeading(history.heading() != null ? history.heading() : 0.0);

        return entity;
    }

    public BusLocationHistory toDomainModel() {
        Location location = new Location(
            null, // id
            "Recorded Location", // name
            latitude,
            longitude
        );
        return new BusLocationHistory(
            new BusLocationHistory.BusLocationHistoryId(id),
            bus.toDomainModel(),
            location,
            timestamp,
            speed,
            heading
        );
    }
}

