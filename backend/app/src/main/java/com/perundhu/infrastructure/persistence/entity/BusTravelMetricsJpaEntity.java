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
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "bus_travel_metrics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BusTravelMetricsJpaEntity {
    
    @Id
    @Column(name = "id")
    private UUID id;
    
    @ManyToOne
    @JoinColumn(name = "bus_id", referencedColumnName = "id")
    private BusJpaEntity bus;
    
    @Column(name = "timestamp")
    private LocalDateTime timestamp;
    
    @Column(name = "speed")
    private Double speed;
    
    @Column(name = "occupancy")
    private Integer occupancy;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes;
    
    @Column(name = "is_on_time")
    private Boolean isOnTime;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    public BusTravelMetrics toDomainModel() {
        return new BusTravelMetrics(
            new BusTravelMetrics.BusTravelMetricsId(id),
            bus.toDomainModel(),
            timestamp,
            speed,
            occupancy,
            delayMinutes,
            isOnTime,
            createdAt
        );
    }
    
    public static BusTravelMetricsJpaEntity fromDomainModel(BusTravelMetrics metrics) {
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