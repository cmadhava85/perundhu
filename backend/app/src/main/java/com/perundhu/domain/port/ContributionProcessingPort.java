package com.perundhu.domain.port;

import java.util.Map;

/**
 * Port for contribution processing operations.
 * Follows Interface Segregation Principle - focused on processing logic.
 */
public interface ContributionProcessingPort {

    /**
     * Process all pending contributions
     */
    void processPendingContributions();

    /**
     * Update contribution status
     * @param contributionId Contribution ID
     * @param status New status
     * @param reason Status change reason
     */
    void updateContributionStatus(String contributionId, String status, String reason);

    /**
     * Get contribution statistics
     * @return Statistics map
     */
    Map<String, Object> getContributionStatistics();
}
