package com.perundhu.infrastructure.persistence.jpa;

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
}

