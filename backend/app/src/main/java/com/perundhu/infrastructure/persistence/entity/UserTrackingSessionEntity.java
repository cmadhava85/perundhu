package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import com.perundhu.domain.model.UserTrackingSession;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

/**
 * JPA Entity for user tracking sessions
 */
@Entity
@Table(name = "user_tracking_sessions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserTrackingSessionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String userId;

    @Column(nullable = false)
    private Long busId;

    @Column(nullable = false)
    private Long startLocationId;

    private Long endLocationId;

    @Column(nullable = false)
    private LocalDateTime startTime;

    private LocalDateTime endTime;

    /**
     * Convert domain model to entity
     */
    public static UserTrackingSessionEntity fromDomainModel(UserTrackingSession domainModel) {
        return UserTrackingSessionEntity.builder()
            .id(domainModel.getId())
            .userId(domainModel.getUserId())
            .busId(domainModel.getBusId())
            .startLocationId(domainModel.getStartLocationId())
            .endLocationId(domainModel.getEndLocationId())
            .startTime(domainModel.getStartTime())
            .endTime(domainModel.getEndTime())
            .build();
    }

    /**
     * Convert entity to domain model
     */
    public UserTrackingSession toDomainModel() {
        return UserTrackingSession.builder()
            .id(this.id)
            .userId(this.userId)
            .busId(this.busId)
            .startLocationId(this.startLocationId)
            .endLocationId(this.endLocationId)
            .startTime(this.startTime)
            .endTime(this.endTime)
            .build();
    }
}
