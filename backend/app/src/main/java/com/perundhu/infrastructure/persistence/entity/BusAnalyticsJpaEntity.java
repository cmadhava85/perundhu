package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;
import java.util.UUID;

import com.perundhu.domain.model.BusAnalytics;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "bus_analytics")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
public class BusAnalyticsJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @EqualsAndHashCode.Include
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bus_id")
    @NotNull(message = "Bus must not be null")
    private BusJpaEntity bus;

    @Column(name = "date", nullable = false)
    @NotNull(message = "Date must not be null")
    private LocalDateTime date;

    @Column(name = "passenger_count")
    private Integer passengerCount;
    
    @Column(name = "delay_minutes")
    private Integer delayMinutes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public static BusAnalyticsJpaEntity fromDomainModel(BusAnalytics analytics) {
        if (analytics == null) return null;

        return BusAnalyticsJpaEntity.builder()
            .id(analytics.getId() != null ? analytics.getId().getValue() : null)
            .bus(analytics.getBus() != null ? BusJpaEntity.fromDomainModel(analytics.getBus()) : null)
            .date(analytics.getDate() != null ? analytics.getDate().atStartOfDay() : null)
            .passengerCount(analytics.getTotalPassengers())
            .delayMinutes(analytics.getAverageDelay() != null ? analytics.getAverageDelay().intValue() : null)
            .createdAt(analytics.getCreatedAt())
            .updatedAt(analytics.getUpdatedAt())
            .build();
    }

    public BusAnalytics toDomainModel() {
        return BusAnalytics.builder()
            .id(new BusAnalytics.BusAnalyticsId(id))
            .bus(bus != null ? bus.toDomainModel() : null)
            .date(date != null ? date.toLocalDate() : null)
            .totalPassengers(passengerCount)
            .averageDelay(delayMinutes != null ? delayMinutes.doubleValue() : null)
            .createdAt(createdAt)
            .updatedAt(updatedAt)
            .build();
    }
}