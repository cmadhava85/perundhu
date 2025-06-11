package com.perundhu.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Domain model for user tracking sessions
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class UserTrackingSession {

    private Long id;
    private String userId;
    private Long busId;
    private Long startLocationId;
    private Long endLocationId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}

