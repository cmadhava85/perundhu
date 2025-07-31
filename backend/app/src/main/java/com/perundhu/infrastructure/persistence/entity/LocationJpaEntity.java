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
import java.util.Objects;

/**
 * JPA entity for locations with manual implementation (no Lombok)
 */
@Entity
@Table(name = "locations")
public class LocationJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    // Default constructor
    public LocationJpaEntity() {}

    // All-args constructor
    public LocationJpaEntity(Long id, String name, Double latitude, Double longitude) {
        this.id = id;
        this.name = name;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    // equals and hashCode (based on id only as per original @EqualsAndHashCode.Include)
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LocationJpaEntity that = (LocationJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "LocationJpaEntity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
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
                .latitude(this.latitude)
                .longitude(this.longitude);
    }

    public static class Builder {
        private Long id;
        private String name;
        private Double latitude;
        private Double longitude;

        private Builder() {}

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder latitude(Double latitude) {
            this.latitude = latitude;
            return this;
        }

        public Builder longitude(Double longitude) {
            this.longitude = longitude;
            return this;
        }

        public LocationJpaEntity build() {
            return new LocationJpaEntity(id, name, latitude, longitude);
        }
    }

    public static LocationJpaEntity fromDomainModel(Location location) {
        if (location == null) return null;
        
        return LocationJpaEntity.builder()
            .id(location.id() != null ? location.id().value() : null)
            .name(location.name())
            .latitude(location.latitude())
            .longitude(location.longitude())
            .build();
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

