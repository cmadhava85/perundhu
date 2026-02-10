package com.perundhu.domain.port;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Legacy input port for contribution use cases.
 * 
 * @deprecated This interface violates the Interface Segregation Principle.
 * Use the new focused interfaces instead:
 *   - {@link RouteContributionInputPort} for route operations
 *   - {@link ImageContributionInputPort} for image operations
 *   - {@link ContributionQueryPort} for query operations
 *   - {@link ContributionProcessingPort} for processing operations
 * 
 * This interface is maintained for backward compatibility only and will be removed in a future version.
 */
@Deprecated
public interface ContributionInputPort {

    /**
     * Submit a route contribution
     */
    RouteContribution submitRouteContribution(Map<String, Object> contributionData, String userId);

    /**
     * Submit an image contribution
     */
    ImageContribution submitImageContribution(Map<String, Object> contributionData, String userId);

    /**
     * Process pending contributions
     */
    void processPendingContributions();

    /**
     * Get user's contributions
     */
    List<Map<String, Object>> getUserContributions(String userId);

    /**
     * Update contribution status
     */
    void updateContributionStatus(String contributionId, String status, String reason);

    /**
     * Get all contributions (admin)
     */
    List<Map<String, Object>> getAllContributions();

    /**
     * Get pending route contributions
     */
    List<RouteContribution> getPendingRouteContributions();

    /**
     * Get pending image contributions
     */
    List<ImageContribution> getPendingImageContributions();

    /**
     * Approve route contribution
     */
    void approveRouteContribution(String contributionId, String adminId);

    /**
     * Reject route contribution
     */
    void rejectRouteContribution(String contributionId, String reason, String adminId);

    /**
     * Approve image contribution
     */
    void approveImageContribution(String contributionId, String adminId);

    /**
     * Reject image contribution
     */
    void rejectImageContribution(String contributionId, String reason, String adminId);

    /**
     * Get contribution statistics
     */
    Map<String, Object> getContributionStatistics();

    /**
     * Find image contribution by ID
     */
    Optional<ImageContribution> findById(String contributionId);
}