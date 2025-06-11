package com.perundhu.domain.port;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Repository interface for managing user contributions.
 * This is a domain port (output port) that will be implemented by an adapter.
 */
public interface ContributionRepository {
    
    /**
     * Save a route contribution
     * 
     * @param contribution The route contribution to save
     * @return The saved contribution with generated ID
     */
    RouteContribution saveRouteContribution(RouteContribution contribution);
    
    /**
     * Save an image contribution
     * 
     * @param contribution The image contribution to save
     * @return The saved contribution with generated ID
     */
    ImageContribution saveImageContribution(ImageContribution contribution);
    
    /**
     * Find route contribution by ID
     * 
     * @param id The contribution ID
     * @return The found contribution or empty
     */
    Optional<RouteContribution> findRouteContributionById(String id);
    
    /**
     * Find image contribution by ID
     * 
     * @param id The contribution ID
     * @return The found contribution or empty
     */
    Optional<ImageContribution> findImageContributionById(String id);
    
    /**
     * Get all contributions for a user
     * 
     * @param userId The user ID
     * @return List of contributions as maps containing type and summary information
     */
    List<Map<String, Object>> getUserContributions(String userId);
    
    /**
     * Get all contributions
     * 
     * @return List of all contributions as maps containing type and summary information
     */
    List<Map<String, Object>> getAllContributions();
    
    /**
     * Find route contributions by status
     * 
     * @param status The status to search for
     * @return List of contributions matching the status
     */
    List<RouteContribution> findByStatus(String status);
}