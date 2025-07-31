package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Objects;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

/**
 * JPA entity for buses with manual implementation (no Lombok)
 */
@Entity
@Table(name = "buses")
public class BusJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Name must not be blank")
    private String name;

    @NotBlank(message = "Bus number must not be blank")
    private String busNumber;

    @NotNull(message = "Departure time must not be null")
    private LocalTime departureTime;

    @NotNull(message = "Arrival time must not be null")
    private LocalTime arrivalTime;

    private Integer capacity;

    private String category;

    private Boolean active = true;

    @NotNull(message = "From location must not be null")
    @ManyToOne
    @JoinColumn(name = "from_location_id")
    private LocationJpaEntity fromLocation;

    @NotNull(message = "To location must not be null")
    @ManyToOne
    @JoinColumn(name = "to_location_id")
    private LocationJpaEntity toLocation;

    // Default constructor
    public BusJpaEntity() {
    }

    // All-args constructor
    public BusJpaEntity(Long id, String name, String busNumber, LocalTime departureTime,
            LocalTime arrivalTime, Integer capacity, String category,
            LocationJpaEntity fromLocation, LocationJpaEntity toLocation,
            Boolean active) {
        this.id = id;
        this.name = name;
        this.busNumber = busNumber;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
        this.capacity = capacity;
        this.category = category;
        this.fromLocation = fromLocation;
        this.toLocation = toLocation;
        this.active = active != null ? active : true;
    }

    // Getters
    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public LocalTime getDepartureTime() {
        return departureTime;
    }

    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    public Integer getCapacity() {
        return capacity;
    }

    public String getCategory() {
        return category;
    }

    public LocationJpaEntity getFromLocation() {
        return fromLocation;
    }

    public LocationJpaEntity getToLocation() {
        return toLocation;
    }

    public Boolean getActive() {
        return active;
    }

    // Setters
    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setBusNumber(String busNumber) {
        this.busNumber = busNumber;
    }

    public void setDepartureTime(LocalTime departureTime) {
        this.departureTime = departureTime;
    }

    public void setArrivalTime(LocalTime arrivalTime) {
        this.arrivalTime = arrivalTime;
    }

    public void setCapacity(Integer capacity) {
        this.capacity = capacity;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setFromLocation(LocationJpaEntity fromLocation) {
        this.fromLocation = fromLocation;
    }

    public void setToLocation(LocationJpaEntity toLocation) {
        this.toLocation = toLocation;
    }

    public void setActive(Boolean active) {
        this.active = active;
    }

    // equals and hashCode (based on id only as per original
    // @EqualsAndHashCode.Include)
    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        BusJpaEntity that = (BusJpaEntity) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    // toString (excluding fromLocation and toLocation to avoid circular references)
    @Override
    public String toString() {
        return "BusJpaEntity{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", busNumber='" + busNumber + '\'' +
                ", departureTime=" + departureTime +
                ", arrivalTime=" + arrivalTime +
                ", capacity=" + capacity +
                ", category='" + category + '\'' +
                ", active=" + active +
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
                .busNumber(this.busNumber)
                .departureTime(this.departureTime)
                .arrivalTime(this.arrivalTime)
                .capacity(this.capacity)
                .category(this.category)
                .fromLocation(this.fromLocation)
                .toLocation(this.toLocation)
                .active(this.active);
    }

    public static class Builder {
        private Long id;
        private String name;
        private String busNumber;
        private LocalTime departureTime;
        private LocalTime arrivalTime;
        private Integer capacity;
        private String category;
        private LocationJpaEntity fromLocation;
        private LocationJpaEntity toLocation;
        private Boolean active = true;

        private Builder() {
        }

        public Builder id(Long id) {
            this.id = id;
            return this;
        }

        public Builder name(String name) {
            this.name = name;
            return this;
        }

        public Builder busNumber(String busNumber) {
            this.busNumber = busNumber;
            return this;
        }

        public Builder departureTime(LocalTime departureTime) {
            this.departureTime = departureTime;
            return this;
        }

        public Builder arrivalTime(LocalTime arrivalTime) {
            this.arrivalTime = arrivalTime;
            return this;
        }

        public Builder capacity(Integer capacity) {
            this.capacity = capacity;
            return this;
        }

        public Builder category(String category) {
            this.category = category;
            return this;
        }

        public Builder fromLocation(LocationJpaEntity fromLocation) {
            this.fromLocation = fromLocation;
            return this;
        }

        public Builder toLocation(LocationJpaEntity toLocation) {
            this.toLocation = toLocation;
            return this;
        }

        public Builder active(Boolean active) {
            this.active = active;
            return this;
        }

        public BusJpaEntity build() {
            return new BusJpaEntity(id, name, busNumber, departureTime, arrivalTime,
                    capacity, category, fromLocation, toLocation, active);
        }
    }

    // Static factory methods
    public static BusJpaEntity fromDomainModel(Bus bus) {
        if (bus == null)
            return null;

        LocationJpaEntity fromLocation = LocationJpaEntity.builder()
                .id(bus.fromLocation().id() != null ? bus.fromLocation().id().value() : null)
                .build();

        LocationJpaEntity toLocation = LocationJpaEntity.builder()
                .id(bus.toLocation().id() != null ? bus.toLocation().id().value() : null)
                .build();

        return BusJpaEntity.builder()
                .id(bus.id() != null ? bus.id().value() : null)
                .name(bus.name())
                .busNumber(bus.busNumber())
                .departureTime(bus.departureTime())
                .arrivalTime(bus.arrivalTime())
                .capacity(bus.capacity())
                .category(bus.category())
                .fromLocation(fromLocation)
                .toLocation(toLocation)
                .active(true) // Default to active
                .build();
    }

    public Bus toDomainModel() {
        return new Bus(
                new Bus.BusId(id),
                name,
                busNumber,
                fromLocation != null ? fromLocation.toDomainModel() : null,
                toLocation != null ? toLocation.toDomainModel() : null,
                departureTime,
                arrivalTime,
                capacity,
                category,
                new ArrayList<>(), // Empty stops list as they're retrieved separately
                new ArrayList<>(), // Empty translations list
                active // Pass active status to domain model
        );
    }
}
