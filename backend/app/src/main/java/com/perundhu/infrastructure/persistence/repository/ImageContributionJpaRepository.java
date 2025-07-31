package com.perundhu.infrastructure.persistence.repository;

import java.time.LocalDateTime;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;

/**
 * JPA repository for image contributions
 */
@Repository("repositoryPackageImageContributionJpaRepository")
public interface ImageContributionJpaRepository extends JpaRepository<ImageContributionJpaEntity, String> {

    List<ImageContributionJpaEntity> findByUserId(String userId);

    List<ImageContributionJpaEntity> findByStatus(String status);

    @Query("SELECT COUNT(i) FROM ImageContributionJpaEntity i WHERE i.status = :status")
    long countByStatus(@Param("status") String status);

    List<ImageContributionJpaEntity> findBySubmissionDateBetween(LocalDateTime start, LocalDateTime end);

    List<ImageContributionJpaEntity> findByUserIdAndStatus(String userId, String status);

    List<ImageContributionJpaEntity> findByLocationContainingIgnoreCase(String locationName);

    boolean existsByImageUrl(String imageUrl);
}
