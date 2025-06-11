package com.perundhu.infrastructure.persistence.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.UserTrackingSessionEntity;

/**
 * Spring Data JPA repository for UserTrackingSession entities
 */
@Repository
public interface UserTrackingSessionJpaRepository extends JpaRepository<UserTrackingSessionEntity, Long> {

    List<UserTrackingSessionEntity> findByUserId(String userId);

}
