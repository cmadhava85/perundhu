package com.perundhu.domain.port;

import com.perundhu.domain.model.RouteContribution;
import java.util.Map;

/**
 * Input port for route contribution operations.
 * Follows Interface Segregation Principle - focused on route contributions only.
 */
public interface RouteContributionInputPort {

    /**
     * Submit a route contribution
     * @param contributionData Route contribution data
     * @param userId User ID submitting the contribution
     * @return Created route contribution
     */
    RouteContribution submitRouteContribution(Map<String, Object> contributionData, String userId);

    /**
     * Approve a route contribution
     * @param contributionId Contribution ID
     * @param adminId Admin ID approving the contribution
     */
    void approveRouteContribution(String contributionId, String adminId);

    /**
     * Reject a route contribution
     * @param contributionId Contribution ID
     * @param reason Rejection reason
     * @param adminId Admin ID rejecting the contribution
     */
    void rejectRouteContribution(String contributionId, String reason, String adminId);
}
