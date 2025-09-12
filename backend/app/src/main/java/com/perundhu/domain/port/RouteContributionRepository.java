package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.RouteContribution;

/**
 * Repository interface for RouteContribution entity
 */
public interface RouteContributionRepository {

    /**
     * Save a route contribution
     * 
     * @param contribution The contribution to save
     * @return The saved contribution with ID
     */
    RouteContribution save(RouteContribution contribution);

    /**
     * Find a route contribution by ID
     * 
     * @param id The contribution ID
     * @return An Optional containing the contribution if found
     */
    Optional<RouteContribution> findById(String id);

    /**
     * Find all route contributions by a user
     * 
     * @param userId The user ID
     * @return List of contributions made by the user
     */
    List<RouteContribution> findByUserId(String userId);

    /**
     * Find all contributions with a specific status
     * 
     * @param status The status to filter by (e.g., "PENDING", "APPROVED",
     *               "REJECTED")
     * @return List of contributions with the specified status
     */
    List<RouteContribution> findByStatus(String status);

    /**
     * Find all route contributions by submitter
     * 
     * @param submittedBy The submitter to filter by
     * @return List of route contributions by the specified submitter
     */
    List<RouteContribution> findBySubmittedBy(String submittedBy);

    /**
     * Find route contributions by submitter after a certain date
     * 
     * @param submittedBy    The submitter to filter by
     * @param submissionDate The date threshold
     * @return List of route contributions by the specified submitter after the date
     */
    List<RouteContribution> findBySubmittedByAndSubmissionDateAfter(String submittedBy, LocalDateTime submissionDate);

    /**
     * Find all route contributions
     * 
     * @return List of all contributions
     */
    List<RouteContribution> findAll();

    /**
     * Delete a contribution
     * 
     * @param id The ID of the contribution to delete
     */
    void deleteById(String id);

    /**
     * Count all route contributions
     * 
     * @return The total number of contributions
     */
    long count();

    /**
     * Count route contributions with a specific status
     * 
     * @param status The status to count (e.g., "PENDING", "APPROVED", "REJECTED")
     * @return The number of contributions with the specified status
     */
    long countByStatus(String status);

    /**
     * Check if a route contribution exists with the given criteria
     * 
     * @param busNumber        The bus number
     * @param fromLocationName The starting location name
     * @param toLocationName   The destination location name
     * @return true if a route contribution exists with the given criteria, false
     *         otherwise
     */
    boolean existsByBusNumberAndFromLocationNameAndToLocationName(
            String busNumber, String fromLocationName, String toLocationName);
}