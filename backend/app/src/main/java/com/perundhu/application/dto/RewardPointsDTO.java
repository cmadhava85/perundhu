package com.perundhu.application.dto;

import java.util.List;

import lombok.Data;

/**
 * DTO for user reward points in the bus tracking incentive system
 */
@Data
public class RewardPointsDTO {
    private String userId;
    private int totalPoints;
    private int currentTripPoints;
    private int lifetimePoints;
    private String userRank;
    private int leaderboardPosition;
    private List<RewardActivityDTO> recentActivities;
    
    /**
     * Inner DTO class for reward activities
     */
    @Data
    public static class RewardActivityDTO {
        private String activityType; // e.g., "BUS_TRACKING", "ROUTE_COMPLETION", "STREAK_BONUS"
        private int pointsEarned;
        private String timestamp;
        private String description;
    }
}