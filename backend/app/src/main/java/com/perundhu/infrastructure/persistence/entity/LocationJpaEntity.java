package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "locations")
@Data
@NoArgsConstructor
public class LocationJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name;
    private Double latitude;
    private Double longitude;
    
    public static LocationJpaEntity fromDomainModel(Location location) {
        LocationJpaEntity entity = new LocationJpaEntity();
        if (location.getId() != null) {
            entity.setId(location.getId().getValue());
        }
        entity.setName(location.getName());
        entity.setLatitude(location.getLatitude());
        entity.setLongitude(location.getLongitude());
        return entity;
    }
    
    public Location toDomainModel() {
        return new Location(
            new Location.LocationId(id),
            name,
            latitude,
            longitude
        );
    }
}