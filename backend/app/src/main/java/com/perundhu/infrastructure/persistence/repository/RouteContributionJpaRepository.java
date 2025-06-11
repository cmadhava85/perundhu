package com.perundhu.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.perundhu.infrastructure.persistence.entity.RouteContributionEntity;

/**
 * Spring Data JPA repository for RouteContributionEntity
 */
@Repository("repositoryPackageRouteContributionJpaRepository")
public interface RouteContributionJpaRepository extends JpaRepository<RouteContributionEntity, Long> {
    
    /**
     * Find all route contributions by a user
     */
    List<RouteContributionEntity> findByUserId(String userId);
    
    /**
     * Find all route contributions with a specific status
     */
    List<RouteContributionEntity> findByStatus(String status);
    
    /**
     * Count route contributions with a specific status
     */
    long countByStatus(String status);
}

