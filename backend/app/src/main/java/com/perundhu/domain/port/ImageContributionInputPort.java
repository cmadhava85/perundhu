package com.perundhu.domain.port;

import com.perundhu.domain.model.ImageContribution;
import java.util.Map;
import java.util.Optional;

/**
 * Input port for image contribution operations.
 * Follows Interface Segregation Principle - focused on image contributions only.
 */
public interface ImageContributionInputPort {

    /**
     * Submit an image contribution
     * @param contributionData Image contribution data
     * @param userId User ID submitting the contribution
     * @return Created image contribution
     */
    ImageContribution submitImageContribution(Map<String, Object> contributionData, String userId);

    /**
     * Approve an image contribution
     * @param contributionId Contribution ID
     * @param adminId Admin ID approving the contribution
     */
    void approveImageContribution(String contributionId, String adminId);

    /**
     * Reject an image contribution
     * @param contributionId Contribution ID
     * @param reason Rejection reason
     * @param adminId Admin ID rejecting the contribution
     */
    void rejectImageContribution(String contributionId, String reason, String adminId);

    /**
     * Find image contribution by ID
     * @param contributionId Contribution ID
     * @return Optional image contribution
     */
    Optional<ImageContribution> findById(String contributionId);
}
