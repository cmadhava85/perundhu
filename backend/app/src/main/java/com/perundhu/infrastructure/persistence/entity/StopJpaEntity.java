package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;

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
@Table(name = "stops") // Changed from "stop" to "stops"
@Data
@NoArgsConstructor
public class StopJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private LocalTime arrivalTime;
    private LocalTime departureTime;
    private Integer stopOrder;
    
    @ManyToOne
    @JoinColumn(name = "bus_id")
    private BusJpaEntity bus;
    
    @ManyToOne
    @JoinColumn(name = "location_id")
    private LocationJpaEntity location;
    
    public static StopJpaEntity fromDomainModel(Stop stop) {
        StopJpaEntity entity = new StopJpaEntity();
        entity.setId(stop.getId().getValue());
        entity.setName(stop.getName());
        entity.setArrivalTime(stop.getArrivalTime());
        entity.setDepartureTime(stop.getDepartureTime());
        entity.setStopOrder(stop.getStopOrder());
        
        // Create bus entity reference
        BusJpaEntity busEntity = new BusJpaEntity();
        busEntity.setId(stop.getBus().getId().getValue());
        entity.setBus(busEntity);
        
        // Create location entity reference
        LocationJpaEntity locationEntity = new LocationJpaEntity();
        locationEntity.setId(stop.getLocation().getId().getValue());
        entity.setLocation(locationEntity);
        
        return entity;
    }
    
    public Stop toDomainModel() {
        Location locationModel = null;
        if (location != null) {
            locationModel = location.toDomainModel();
        } else if (bus != null && bus.getFromLocation() != null) {
            locationModel = new Location(
                new Location.LocationId(0L), 
                name, 
                0.0, 
                0.0
            );
        }
        
        return new Stop(
            new Stop.StopId(id),
            name,
            bus.toDomainModel(),
            locationModel,
            arrivalTime,
            departureTime,
            stopOrder
        );
    }
}