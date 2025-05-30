package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.perundhu.domain.model.BusAnalytics;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "bus_analytics")
public class BusAnalyticsJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "bus_id", nullable = false)
    private UUID busId;

    @Column(name = "date", nullable = false)
    private LocalDateTime date;

    @Column(name = "passenger_count")
    private Integer passengerCount;

    @Column(name = "fuel_consumption")
    private Double fuelConsumption;

    @Column(name = "distance_traveled")
    private Double distanceTraveled;

    @Column(name = "maintenance_status")
    private String maintenanceStatus;
    
    @Column(name = "revenue")
    private Double revenue;
    
    @Column(name = "operational_cost")
    private Double operationalCost;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    public static BusAnalyticsJpaEntity fromDomainModel(BusAnalytics analytics) {
        if (analytics == null) return null;

        UUID resolvedBusId = null;
        if (analytics.getBus() != null && analytics.getBus().getId() != null) {
            Object busIdValue = analytics.getBus().getId().getValue();
            if (busIdValue instanceof UUID) {
                resolvedBusId = (UUID) busIdValue;
            }
            // If busIdValue is a Long or other type, resolvedBusId remains null
        }

        return BusAnalyticsJpaEntity.builder()
            .id(analytics.getId() != null ? analytics.getId().getValue() : null)
            .busId(resolvedBusId)
            .date(analytics.getDate() != null ? analytics.getDate().atStartOfDay() : null)
            .passengerCount(analytics.getTotalPassengers())
            .fuelConsumption(null) // Map if available in domain
            .distanceTraveled(null) // Map if available in domain
            .maintenanceStatus(null) // Map if available in domain
            .revenue(null) // Map if available in domain
            .operationalCost(null) // Map if available in domain
            .delayMinutes(analytics.getAverageDelay() != null ? analytics.getAverageDelay().intValue() : null)
            .build();
    }

    public BusAnalytics toDomainModel() {
        return BusAnalytics.builder()
            .id(id != null ? new BusAnalytics.BusAnalyticsId(id) : null)
            .bus(null) // You may need to fetch the Bus by busId elsewhere
            .date(date != null ? date.toLocalDate() : null)
            .totalPassengers(passengerCount)
            .averageDelay(delayMinutes != null ? delayMinutes.doubleValue() : null)
            .averageSpeed(null) // Map if available in entity
            .totalTrips(null) // Map if available in entity
            .onTimePerformance(null) // Map if available in entity
            .averageOccupancy(null) // Map if available in entity
            .createdAt(null) // Not present in entity
            .updatedAt(null) // Not present in entity
            .build();
    }
}