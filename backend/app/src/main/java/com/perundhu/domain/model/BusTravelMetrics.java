package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.Value;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BusTravelMetrics {

    private BusTravelMetricsId id;
    private Bus bus;
    private LocalDateTime timestamp;
    private Double speed;
    private Integer occupancy;
    private Integer delayMinutes;
    private Boolean isOnTime;
    private LocalDateTime createdAt;

    @Value
    @EqualsAndHashCode(callSuper = false)
    public static class BusTravelMetricsId {
        UUID value;
    }

    public static BusTravelMetrics create(Bus bus, Double speed, Integer occupancy, Integer delayMinutes, Boolean isOnTime) {
        BusTravelMetrics metrics = new BusTravelMetrics();
        metrics.setId(new BusTravelMetricsId(UUID.randomUUID()));
        metrics.setBus(bus);
        metrics.setTimestamp(LocalDateTime.now());
        metrics.setSpeed(speed);
        metrics.setOccupancy(occupancy);
        metrics.setDelayMinutes(delayMinutes);
        metrics.setIsOnTime(isOnTime);
        metrics.setCreatedAt(LocalDateTime.now());
        return metrics;
    }
}