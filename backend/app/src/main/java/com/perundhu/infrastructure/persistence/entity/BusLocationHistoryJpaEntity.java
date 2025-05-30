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
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bus_location_history")
@Data
@NoArgsConstructor
public class BusLocationHistoryJpaEntity {
    
    @Id
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "bus_id")
    private BusJpaEntity bus;
    
    private Double latitude;
    private Double longitude;
    private Double speed;
    private Double heading;
    
    private LocalDateTime timestamp;
    
    public static BusLocationHistoryJpaEntity fromDomainModel(BusLocationHistory history) {
        BusLocationHistoryJpaEntity entity = new BusLocationHistoryJpaEntity();
        if (history.getId() != null && history.getId().getValue() != null) {
            entity.setId(history.getId().getValue());
        }
        // Create bus entity reference
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(history.getBus().getId().getValue());
        entity.setBus(busEntity);
        // Extract latitude and longitude from Location
        if (history.getLocation() != null) {
            entity.setLatitude(history.getLocation().getLatitude());
            entity.setLongitude(history.getLocation().getLongitude());
        } else {
            entity.setLatitude(null);
            entity.setLongitude(null);
        }
        entity.setSpeed(history.getSpeed());
        entity.setHeading(history.getHeading());
        entity.setTimestamp(history.getTimestamp());
        return entity;
    }

    public BusLocationHistory toDomainModel() {
        // Create Location from latitude/longitude (other fields are placeholders)
        Location location = new Location(
            null, // No ID
            "Recorded Location", // Placeholder name
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