package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Value;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class BusTravelMetrics {

    private BusTravelMetricsId id;
    private Bus bus;
    private Location fromLocation;
    private Location toLocation;
    private LocalDateTime timestamp;
    private Double speed;
    private Integer occupancy;
    private Integer delayMinutes;
    private Boolean isOnTime;
    private Integer durationMinutes;
    private Integer passengerCount;
    private LocalDateTime createdAt;

    @Value
    @EqualsAndHashCode(callSuper = false)
    @Builder
    public static class BusTravelMetricsId {
        UUID value;
        
        public BusTravelMetricsId(UUID value) {
            this.value = value;
        }
    }

    public static BusTravelMetrics create(
            Bus bus, 
            Location fromLocation, 
            Location toLocation, 
            Double speed, 
            Integer occupancy, 
            Integer delayMinutes, 
            Boolean isOnTime,
            Integer durationMinutes) {
        BusTravelMetrics metrics = new BusTravelMetrics();
        metrics.setId(new BusTravelMetricsId(UUID.randomUUID()));
        metrics.setBus(bus);
        metrics.setFromLocation(fromLocation);
        metrics.setToLocation(toLocation);
        metrics.setTimestamp(LocalDateTime.now());
        metrics.setSpeed(speed);
        metrics.setOccupancy(occupancy);
        metrics.setDelayMinutes(delayMinutes);
        metrics.setIsOnTime(isOnTime);
        metrics.setDurationMinutes(durationMinutes);
        metrics.setPassengerCount((int)(occupancy * bus.getCapacity() / 100));
        metrics.setCreatedAt(LocalDateTime.now());
        return metrics;
    }
}