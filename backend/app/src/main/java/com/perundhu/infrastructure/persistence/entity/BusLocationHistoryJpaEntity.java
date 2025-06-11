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

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "bus_location_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class BusLocationHistoryJpaEntity {
    
    @Id
    @EqualsAndHashCode.Include
    private UUID id;
    
    @NotNull(message = "Bus must not be null")
    @ManyToOne
    @JoinColumn(name = "bus_id")
    private BusJpaEntity bus;
    
    @NotNull(message = "Latitude must not be null")
    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    private Double latitude;
    
    @NotNull(message = "Longitude must not be null")
    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 180, message = "Longitude must be <= 180")
    private Double longitude;
    
    @Min(value = 0, message = "Speed must be non-negative")
    private Double speed;
    
    @Min(value = 0, message = "Heading must be >= 0")
    @Max(value = 360, message = "Heading must be <= 360")
    private Double heading;
    
    @NotNull(message = "Timestamp must not be null")
    private LocalDateTime timestamp;
    
    public static BusLocationHistoryJpaEntity fromDomainModel(BusLocationHistory history) {
        if (history == null) return null;
        
        BusJpaEntity busEntity = BusJpaEntity.builder()
            .id(history.getBus().getId().getValue())
            .build();
            
        return BusLocationHistoryJpaEntity.builder()
            .id(history.getId().getValue())
            .bus(busEntity)
            .latitude(history.getLocation().getLatitude())
            .longitude(history.getLocation().getLongitude())
            .timestamp(history.getTimestamp())
            .speed(history.getSpeed())
            .heading(history.getHeading())
            .build();
    }

    public BusLocationHistory toDomainModel() {
        Location location = Location.builder()
            .name("Recorded Location")
            .latitude(latitude)
            .longitude(longitude)
            .build();
        
        return BusLocationHistory.builder()
            .id(new BusLocationHistory.BusLocationHistoryId(id))
            .bus(bus.toDomainModel())
            .location(location)
            .timestamp(timestamp)
            .speed(speed)
            .heading(heading)
            .build();
    }
}