package com.perundhu.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

import com.perundhu.infrastructure.persistence.entity.RouteContributionJpaEntity;

/**
 * Spring Data JPA repository for RouteContributionJpaEntity
 */
@Repository("repositoryPackageRouteContributionJpaRepository")
public interface RouteContributionJpaRepository extends JpaRepository<RouteContributionJpaEntity, String> {

    /**
     * Find all route contributions by a user
     */
    List<RouteContributionJpaEntity> findByUserId(String userId);

    /**
     * Find all route contributions with a specific status
     */
    List<RouteContributionJpaEntity> findByStatus(String status);

    /**
     * Count route contributions with a specific status
     */
    long countByStatus(String status);
}
