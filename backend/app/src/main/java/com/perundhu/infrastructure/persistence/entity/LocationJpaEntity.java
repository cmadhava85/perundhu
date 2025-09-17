package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

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

    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    private Double latitude;

    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 180, message = "Longitude must be <= 180")
    private Double longitude;

    // OSM-specific fields for enhanced integration
    @Column(name = "osm_node_id")
    private Long osmNodeId;

    @Column(name = "osm_way_id")
    private Long osmWayId;

    @Column(name = "last_osm_update")
    private LocalDateTime lastOsmUpdate;

    @Column(name = "osm_tags", columnDefinition = "JSON")
    private String osmTags;

    public static LocationJpaEntity fromDomainModel(Location location) {
        if (location == null)
            return null;

        return LocationJpaEntity.builder()
                .id(location.id() != null ? location.id().value() : null)
                .name(location.name())
                .latitude(location.latitude())
                .longitude(location.longitude())
                .build();
    }

    public Location toDomainModel() {
        return new Location(
                new LocationId(id),
                name,
                null, // nameLocalLanguage - not in JPA entity
                latitude, // Keep as nullable Double
                longitude // Keep as nullable Double
        );
    }
}