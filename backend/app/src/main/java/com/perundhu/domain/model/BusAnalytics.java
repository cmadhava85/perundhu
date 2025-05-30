package com.perundhu.domain.model;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Value;

@AllArgsConstructor
@Getter
@Builder
@EqualsAndHashCode(of = "id")
public class BusAnalytics {
    
    private final BusAnalyticsId id;
    private final Bus bus;
    private final LocalDate date;
    private final Double averageSpeed;
    private final Integer totalTrips;
    private final Double onTimePerformance; // percentage of on-time arrivals
    private final Double averageDelay; // in minutes
    private final Integer totalPassengers;
    private final Double averageOccupancy; // percentage
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    
    @Value
    public static class BusAnalyticsId {
        UUID value;
        
        public static BusAnalyticsId generate() {
            return new BusAnalyticsId(UUID.randomUUID());
        }
    }
}