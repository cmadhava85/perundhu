package com.perundhu.domain.port;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.LanguageCode;
import com.perundhu.domain.model.RouteContribution;

/**
 * Repository interface for RouteContribution entity
 * Updated to use proper Java 17 record-based ID types
 */
public interface RouteContributionRepository {
    
    RouteContribution save(RouteContribution contribution);
    
    Optional<RouteContribution> findById(RouteContribution.RouteContributionId id);

    List<RouteContribution> findByUserId(String userId);
    
    List<RouteContribution> findByStatus(RouteContribution.ContributionStatus status);

    List<RouteContribution> findPendingContributions();

    List<RouteContribution> findBySubmissionDateBetween(LocalDateTime start, LocalDateTime end);

    void delete(RouteContribution.RouteContributionId id);

    // Enhanced methods using Java 17 features
    List<RouteContribution> findByBusNumber(String busNumber);

    List<RouteContribution> findBySourceLanguage(LanguageCode sourceLanguage);

    List<RouteContribution> findByUserIdAndStatus(String userId, RouteContribution.ContributionStatus status);

    List<RouteContribution> findReadyForSubmission();

    long countByStatus(RouteContribution.ContributionStatus status);

    /**
     * Count all route contributions
     *
     * @return The total number of route contributions
     */
    long count();

    boolean existsByBusNumberAndRoute(String busNumber, String fromLocationName, String toLocationName);
}
