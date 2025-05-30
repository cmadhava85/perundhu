package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "buses")
@Data
@NoArgsConstructor
public class BusJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private String busNumber;
    private LocalTime departureTime;
    private LocalTime arrivalTime;
    
    @ManyToOne
    @JoinColumn(name = "from_location_id")
    private LocationJpaEntity fromLocation;
    
    @ManyToOne
    @JoinColumn(name = "to_location_id")
    private LocationJpaEntity toLocation;
    
    public static BusJpaEntity fromDomainModel(Bus bus) {
        BusJpaEntity entity = new BusJpaEntity();
        entity.setId(bus.getId().getValue());
        entity.setName(bus.getName());
        entity.setBusNumber(bus.getBusNumber());
        entity.setDepartureTime(bus.getDepartureTime());
        entity.setArrivalTime(bus.getArrivalTime());
        
        // Create location entities
        LocationJpaEntity fromEntity = new LocationJpaEntity();
        fromEntity.setId(bus.getFromLocation().getId().getValue());
        
        LocationJpaEntity toEntity = new LocationJpaEntity();
        toEntity.setId(bus.getToLocation().getId().getValue());
        
        entity.setFromLocation(fromEntity);
        entity.setToLocation(toEntity);
        
        return entity;
    }
    
    public Bus toDomainModel() {
        Location fromLocation = this.fromLocation.toDomainModel();
        Location toLocation = this.toLocation.toDomainModel();
        
        return new Bus(
            new Bus.BusId(id),
            name,
            busNumber,
            fromLocation,
            toLocation,
            departureTime,
            arrivalTime
        );
    }
}