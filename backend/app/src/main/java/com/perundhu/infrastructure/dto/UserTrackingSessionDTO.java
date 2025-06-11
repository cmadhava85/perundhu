package com.perundhu.infrastructure.dto;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder(toBuilder = true)
public class UserTrackingSessionDTO {
    private Long id;
    private String userId;
    private Long busId;
    private Long startLocationId;
    private Long endLocationId;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
}