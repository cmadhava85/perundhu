package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.UserTrackingSessionEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository("repositoryPackageUserTrackingSessionJpaRepository")
public interface UserTrackingSessionJpaRepository extends JpaRepository<UserTrackingSessionEntity, Long> {
    Optional<UserTrackingSessionEntity> findBySessionId(String sessionId);

    /**
     * Find all tracking sessions by user ID
     * @param userId The user ID to search for
     * @return List of tracking sessions for the given user
     */
    List<UserTrackingSessionEntity> findByUserId(String userId);
}
