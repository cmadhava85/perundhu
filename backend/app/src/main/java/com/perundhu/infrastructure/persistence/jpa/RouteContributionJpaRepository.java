package com.perundhu.infrastructure.persistence.jpa;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;

/**
 * Spring Data JPA repository for route contributions
 */
@Repository("jpaPackageRouteContributionJpaRepository")
public interface RouteContributionJpaRepository extends JpaRepository<RouteContributionJpaEntity, String> {

    /**
     * Find all route contributions by user ID
     * 
     * @param userId The user ID
     * @return List of route contributions
     */
    List<RouteContributionJpaEntity> findByUserId(String userId);

    /**
     * Find all route contributions by status
     * 
     * @param status The status to search for
     * @return List of route contributions with the given status
     */
    List<RouteContributionJpaEntity> findByStatus(String status);

    /**
     * Find all route contributions by submitter
     * 
     * @param submittedBy The submitter identifier
     * @return List of route contributions by the submitter
     */
    List<RouteContributionJpaEntity> findBySubmittedBy(String submittedBy);

    /**
     * Find route contributions by submitter and submission date after a given date
     * 
     * @param submittedBy    The submitter identifier
     * @param submissionDate The date threshold
     * @return List of route contributions matching criteria
     */
    List<RouteContributionJpaEntity> findBySubmittedByAndSubmissionDateAfter(String submittedBy,
            LocalDateTime submissionDate);

    /**
     * Count route contributions by status
     * 
     * @param status The status to count
     * @return Number of contributions with given status
     */
    long countByStatus(String status);

    /**
     * Check if a route contribution exists by bus number and locations
     * 
     * @param busNumber        The bus number
     * @param fromLocationName The origin location name
     * @param toLocationName   The destination location name
     * @return true if exists, false otherwise
     */
    boolean existsByBusNumberAndFromLocationNameAndToLocationName(
            String busNumber, String fromLocationName, String toLocationName);
}
