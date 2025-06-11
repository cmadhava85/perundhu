package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalTime;
import java.time.LocalDateTime;

import com.perundhu.domain.model.Stop;
import com.perundhu.domain.model.Location;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Column;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(name = "stops") // Updated to match the correct database table name
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"bus", "location"})
public class StopJpaEntity {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @EqualsAndHashCode.Include
    private Long id;
    
    @NotBlank(message = "Name must not be blank")
    private String name;
    
    @NotNull(message = "Arrival time must not be null")
    @Column(name = "arrival_time")
    private LocalTime arrivalTime;
    
    @NotNull(message = "Departure time must not be null")
    @Column(name = "departure_time")
    private LocalTime departureTime;
    
    @NotNull(message = "Stop order must not be null")
    @Min(value = 0, message = "Stop order must be non-negative")
    @Column(name = "stop_order")
    private Integer stopOrder;
    
    @NotNull(message = "Bus must not be null")
    @ManyToOne
    @JoinColumn(name = "bus_id")
    private BusJpaEntity bus;
    
    @NotNull(message = "Location must not be null")
    @ManyToOne
    @JoinColumn(name = "location_id")
    private LocationJpaEntity location;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    public static StopJpaEntity fromDomainModel(Stop stop) {
        if (stop == null) return null;
        
        return StopJpaEntity.builder()
            .id(stop.getId().getValue())
            .name(stop.getName())
            .arrivalTime(stop.getArrivalTime())
            .departureTime(stop.getDepartureTime())
            .stopOrder(stop.getStopOrder())
            .bus(BusJpaEntity.builder()
                .id(stop.getBus().getId().getValue())
                .build())
            .location(LocationJpaEntity.builder()
                .id(stop.getLocation().getId().getValue())
                .build())
            .build();
    }
    
    public Stop toDomainModel() {
        try {
            return new Stop(
                new Stop.StopId(id),
                name,
                bus != null ? bus.toDomainModel() : null,
                location != null ? location.toDomainModel() : Location.reference(0L),
                arrivalTime,
                departureTime,
                stopOrder
            );
        } catch (Exception e) {
            // Log the exception details to help with debugging
            System.err.println("Error converting StopJpaEntity to Stop domain model: " + e.getMessage());
            e.printStackTrace();
            
            // Create a default Stop with minimal information to avoid NPE
            Stop.resetStopOrders(); // Reset order tracking to avoid duplicate order exception
            return new Stop(
                new Stop.StopId(id),
                name != null ? name : "Unknown Stop",
                bus != null ? bus.toDomainModel() : null,
                Location.reference(0L),
                arrivalTime,
                departureTime,
                stopOrder != null ? stopOrder : 0
            );
        }
    }
}

