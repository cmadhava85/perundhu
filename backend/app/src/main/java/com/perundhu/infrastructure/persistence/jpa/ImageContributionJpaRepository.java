package com.perundhu.infrastructure.persistence.jpa;

import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ImageContributionJpaRepository extends JpaRepository<ImageContributionJpaEntity, String> {

    List<ImageContributionJpaEntity> findByUserId(String userId);

    List<ImageContributionJpaEntity> findByStatus(String status);

    Page<ImageContributionJpaEntity> findByStatus(String status, Pageable pageable);

    long countByStatus(String status);

    Optional<ImageContributionJpaEntity> findByImageUrl(String imageUrl);
}