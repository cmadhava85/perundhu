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
@Builder(toBuilder = true)
@EqualsAndHashCode(of = "id")
public class BusAnalytics {
    private final BusAnalyticsId id;
    private final Bus bus;
    private final LocalDate date;
    private final Integer totalPassengers;
    private final Double averageDelay;
    private final Double averageSpeed;
    private final Integer totalTrips;
    private final Double onTimePerformance;
    private final Double averageOccupancy;
    private final LocalDateTime createdAt;
    private final LocalDateTime updatedAt;
    
    @Value
    @Builder
    public static class BusAnalyticsId {
        UUID value;
        
        public BusAnalyticsId(UUID value) {
            this.value = value;
        }
        
        public static BusAnalyticsId generate() {
            return BusAnalyticsId.builder()
                .value(UUID.randomUUID())
                .build();
        }
    }
}