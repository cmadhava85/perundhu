package com.perundhu.infrastructure.persistence.entity;

import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "locations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class LocationJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @NotBlank(message = "Name must not be blank")
    private String name;
    
    @NotNull(message = "Latitude must not be null")
    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    private Double latitude;
    
    @NotNull(message = "Longitude must not be null")
    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 180, message = "Longitude must be <= 180")
    private Double longitude;
    
    public static LocationJpaEntity fromDomainModel(Location location) {
        if (location == null) return null;
        
        return LocationJpaEntity.builder()
            .id(location.getId() != null ? location.getId().getValue() : null)
            .name(location.getName())
            .latitude(location.getLatitude())
            .longitude(location.getLongitude())
            .build();
    }
    
    public Location toDomainModel() {
        return Location.builder()
            .id(new Location.LocationId(id))
            .name(name)
            .latitude(latitude)
            .longitude(longitude)
            .build();
    }
}