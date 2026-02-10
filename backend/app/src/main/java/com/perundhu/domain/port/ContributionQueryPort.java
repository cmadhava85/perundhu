package com.perundhu.domain.port;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import java.util.List;
import java.util.Map;

/**
 * Query port for contribution read operations.
 * Follows Interface Segregation Principle - focused on queries only.
 */
public interface ContributionQueryPort {

    /**
     * Get all contributions for a user
     * @param userId User ID
     * @return List of user contributions
     */
    List<Map<String, Object>> getUserContributions(String userId);

    /**
     * Get all contributions (admin)
     * @return List of all contributions
     */
    List<Map<String, Object>> getAllContributions();

    /**
     * Get pending route contributions
     * @return List of pending route contributions
     */
    List<RouteContribution> getPendingRouteContributions();

    /**
     * Get pending image contributions
     * @return List of pending image contributions
     */
    List<ImageContribution> getPendingImageContributions();
}
