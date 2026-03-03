package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.AdminUserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

/**
 * JPA Repository for AdminUserEntity
 * Infrastructure layer
 */
@Repository
public interface AdminUserJpaRepository extends JpaRepository<AdminUserEntity, Long> {

    Optional<AdminUserEntity> findByUsername(String username);

    @Query("SELECT COUNT(u) FROM AdminUserEntity u WHERE u.enabled = true")
    long countByEnabledTrue();
}
