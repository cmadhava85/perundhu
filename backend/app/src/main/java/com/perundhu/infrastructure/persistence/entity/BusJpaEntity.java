package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;
import java.time.LocalDateTime;
import java.util.List;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(name = "buses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = { "fromLocation", "toLocation" })
public class BusJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;

    @NotBlank(message = "Name must not be blank")
    private String name;

    @NotBlank(message = "Bus number must not be blank")
    private String busNumber;

    @NotNull(message = "Departure time must not be null")
    private LocalTime departureTime;

    @NotNull(message = "Arrival time must not be null")
    private LocalTime arrivalTime;

    @NotNull(message = "From location must not be null")
    @ManyToOne
    @JoinColumn(name = "from_location_id")
    private LocationJpaEntity fromLocation;

    @NotNull(message = "To location must not be null")
    @ManyToOne
    @JoinColumn(name = "to_location_id")
    private LocationJpaEntity toLocation;

    private Integer capacity;

    private String category;

    @Builder.Default
    private Boolean active = true;

    public static BusJpaEntity fromDomainModel(Bus bus) {
        if (bus == null)
            return null;

        return BusJpaEntity.builder()
                .id(bus.id().value())
                .name(bus.name())
                .busNumber(bus.number())
                .departureTime(bus.departureTime())
                .arrivalTime(bus.arrivalTime())
                .fromLocation(bus.fromLocation() != null ? LocationJpaEntity.fromDomainModel(bus.fromLocation()) : null)
                .toLocation(bus.toLocation() != null ? LocationJpaEntity.fromDomainModel(bus.toLocation()) : null)
                .capacity(bus.capacity())
                .category(bus.type())
                .active(true)
                .build();
    }

    public Bus toDomainModel() {
        return new Bus(
                new BusId(id),
                busNumber,
                name,
                "Unknown", // operator - not in JPA entity
                category != null ? category : "Unknown", // type
                fromLocation != null ? fromLocation.toDomainModel() : null, // fromLocation
                toLocation != null ? toLocation.toDomainModel() : null, // toLocation
                departureTime != null ? departureTime : LocalTime.of(9, 0), // departureTime
                arrivalTime != null ? arrivalTime : LocalTime.of(17, 0), // arrivalTime
                capacity != null ? capacity : 50, // capacity
                List.of() // features - not in JPA entity
        );
    }
}