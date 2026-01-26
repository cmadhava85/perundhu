package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "locations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"parent", "children"}) // Avoid circular reference in toString
public class LocationJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    // Hierarchical relationship: parent location (e.g., Chennai is parent of CMBT, KCBT)
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private LocationJpaEntity parent;

    // Hierarchical relationship: child locations (e.g., CMBT, KCBT are children of Chennai)
    @OneToMany(mappedBy = "parent", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @Builder.Default
    private List<LocationJpaEntity> children = new ArrayList<>();

    // Location type for hierarchical management
    @Enumerated(EnumType.STRING)
    @Column(name = "location_type", length = 20)
    @Builder.Default
    private LocationType locationType = LocationType.CITY;

    @NotBlank(message = "Name must not be blank")
    private String name;

    @Min(value = -90, message = "Latitude must be >= -90")
    @Max(value = 90, message = "Latitude must be <= 90")
    private Double latitude;

    @Min(value = -180, message = "Longitude must be >= -180")
    @Max(value = 180, message = "Longitude must be <= 180")
    private Double longitude;

    // District/Taluk for disambiguation of duplicate village names
    @Column(name = "district")
    private String district;

    // Nearby major city/town for disambiguation
    @Column(name = "nearby_city")
    private String nearbyCity;

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
                .district(location.district())
                .nearbyCity(location.nearbyCity())
                // OSM fields are not mapped from domain model as domain model doesn't include them
                // They are preserved from the database entity when updating
                .build();
    }

    public Location toDomainModel() {
        return new Location(
                new LocationId(id),
                name,
                null, // nameLocalLanguage - not in JPA entity
                latitude,
                longitude,
                district,
                nearbyCity);
    }
}