package com.perundhu.application.dto;

import java.util.Collections;
import java.util.List;

/**
 * DTO for user reward points in the bus tracking incentive system
 * Implemented as an immutable record for Java 17 compatibility
 */
public record RewardPointsDTO(
    String userId,
    int totalPoints,
    int currentTripPoints,
    int lifetimePoints,
    String userRank,
    int leaderboardPosition,
    List<RewardActivityDTO> recentActivities
) {
    /**
     * Custom constructor with validation and defensive copying
     */
    public RewardPointsDTO {
        // Defensive copying of the mutable list to ensure immutability
        recentActivities = recentActivities != null
            ? List.copyOf(recentActivities)
            : List.of();
    }

    /**
     * Factory method for creating a default instance
     * Using static factory method pattern for Java 17 compatibility
     */
    public static RewardPointsDTO createDefault() {
        return new RewardPointsDTO(null, 0, 0, 0, "BEGINNER", 0, List.of());
    }

    /**
     * Get an unmodifiable view of recent activities
     * Method is retained for API compatibility
     */
    public List<RewardActivityDTO> getRecentActivities() {
        return recentActivities;
    }

    /**
     * Returns a new instance with updated total points
     */
    public RewardPointsDTO withTotalPoints(int newTotalPoints) {
        return new RewardPointsDTO(
            userId, newTotalPoints, currentTripPoints,
            lifetimePoints, userRank, leaderboardPosition, recentActivities
        );
    }

    /**
     * Returns a new instance with updated current trip points
     */
    public RewardPointsDTO withCurrentTripPoints(int newCurrentTripPoints) {
        return new RewardPointsDTO(
            userId, totalPoints, newCurrentTripPoints,
            lifetimePoints, userRank, leaderboardPosition, recentActivities
        );
    }

    /**
     * Returns a new instance with updated lifetime points
     */
    public RewardPointsDTO withLifetimePoints(int newLifetimePoints) {
        return new RewardPointsDTO(
            userId, totalPoints, currentTripPoints,
            newLifetimePoints, userRank, leaderboardPosition, recentActivities
        );
    }

    /**
     * Returns a new instance with updated user rank
     */
    public RewardPointsDTO withUserRank(String newUserRank) {
        return new RewardPointsDTO(
            userId, totalPoints, currentTripPoints,
            lifetimePoints, newUserRank, leaderboardPosition, recentActivities
        );
    }

    /**
     * Returns a new instance with updated recent activities
     */
    public RewardPointsDTO withRecentActivities(List<RewardActivityDTO> newRecentActivities) {
        return new RewardPointsDTO(
            userId, totalPoints, currentTripPoints,
            lifetimePoints, userRank, leaderboardPosition, newRecentActivities
        );
    }

    /**
     * Inner DTO record for reward activities
     */
    public record RewardActivityDTO(
        String activityType,
        int pointsEarned,
        String timestamp,
        String description
    ) {
        /**
         * Factory method for creating a default instance
         */
        public static RewardActivityDTO createDefault() {
            return new RewardActivityDTO(null, 0, null, null);
        }
    }
}
