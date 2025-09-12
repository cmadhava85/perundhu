package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;

import com.perundhu.domain.model.Bus;

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

        LocationJpaEntity fromLocation = LocationJpaEntity.builder()
                .id(bus.getFromLocation().getId().getValue())
                .build();

        LocationJpaEntity toLocation = LocationJpaEntity.builder()
                .id(bus.getToLocation().getId().getValue())
                .build();

        return BusJpaEntity.builder()
                .id(bus.getId().getValue())
                .name(bus.getName())
                .busNumber(bus.getBusNumber())
                .departureTime(bus.getDepartureTime())
                .arrivalTime(bus.getArrivalTime())
                .fromLocation(fromLocation)
                .toLocation(toLocation)
                .capacity(bus.getCapacity())
                .category(bus.getCategory())
                .active(bus.getActive())
                .build();
    }

    public Bus toDomainModel() {
        return Bus.builder()
                .id(new Bus.BusId(id))
                .name(name)
                .busNumber(busNumber)
                .fromLocation(fromLocation.toDomainModel())
                .toLocation(toLocation.toDomainModel())
                .departureTime(departureTime)
                .arrivalTime(arrivalTime)
                .capacity(capacity)
                .category(category)
                .active(active)
                .build();
    }
}