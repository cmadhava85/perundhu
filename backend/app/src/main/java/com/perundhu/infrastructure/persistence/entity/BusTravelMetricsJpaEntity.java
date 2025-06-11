package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.perundhu.domain.model.BusTravelMetrics;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.ToString;

@Entity
@Table(name = "bus_travel_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@ToString(exclude = {"bus"})
public class BusTravelMetricsJpaEntity {
    
    @Id
    @Column(name = "id")
    @EqualsAndHashCode.Include
    private UUID id;
    
    @NotNull(message = "Bus must not be null")
    @ManyToOne
    @JoinColumn(name = "bus_id", referencedColumnName = "id")
    private BusJpaEntity bus;
    
    @NotNull(message = "Timestamp must not be null")
    @Column(name = "timestamp")
    private LocalDateTime timestamp;
    
    @Min(value = 0, message = "Speed must be non-negative")
    @Column(name = "speed")
    private Double speed;
    
    @Min(value = 0, message = "Occupancy must be non-negative")
    @Column(name = "occupancy")
    private Integer occupancy;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes;
    
    @Column(name = "is_on_time")
    private Boolean isOnTime;
    
    @NotNull(message = "Created at must not be null")
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public BusTravelMetrics toDomainModel() {
        return BusTravelMetrics.builder()
            .id(new BusTravelMetrics.BusTravelMetricsId(id))
            .bus(bus.toDomainModel())
            .timestamp(timestamp)
            .speed(speed)
            .occupancy(occupancy)
            .delayMinutes(delayMinutes)
            .isOnTime(isOnTime)
            .createdAt(createdAt)
            .build();
    }
    
    public static BusTravelMetricsJpaEntity fromDomainModel(BusTravelMetrics metrics) {
        if (metrics == null) return null;
        
        return BusTravelMetricsJpaEntity.builder()
            .id(metrics.getId().getValue())
            .bus(BusJpaEntity.fromDomainModel(metrics.getBus()))
            .timestamp(metrics.getTimestamp())
            .speed(metrics.getSpeed())
            .occupancy(metrics.getOccupancy())
            .delayMinutes(metrics.getDelayMinutes())
            .isOnTime(metrics.getIsOnTime())
            .createdAt(metrics.getCreatedAt())
            .build();
    }
}