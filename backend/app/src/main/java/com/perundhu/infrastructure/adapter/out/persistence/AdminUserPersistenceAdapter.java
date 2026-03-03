package com.perundhu.infrastructure.adapter.out.persistence;

import com.perundhu.domain.model.AdminUser;
import com.perundhu.domain.port.out.AdminUserManagementOutputPort;
import com.perundhu.infrastructure.persistence.entity.AdminUserEntity;
import com.perundhu.infrastructure.persistence.repository.AdminUserJpaRepository;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

/**
 * Persistence adapter implementing AdminUserManagementOutputPort
 * Maps between domain models and JPA entities
 */
@Component
public class AdminUserPersistenceAdapter implements AdminUserManagementOutputPort {

    private final AdminUserJpaRepository jpaRepository;
    private final JdbcTemplate jdbcTemplate;

    public AdminUserPersistenceAdapter(
            AdminUserJpaRepository jpaRepository,
            JdbcTemplate jdbcTemplate) {
        this.jpaRepository = jpaRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public Optional<AdminUser> findById(Long id) {
        return jpaRepository.findById(id)
                .map(this::toDomain);
    }

    @Override
    public Optional<AdminUser> findByUsername(String username) {
        return jpaRepository.findByUsername(username)
                .map(this::toDomain);
    }

    @Override
    public List<AdminUser> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::toDomain)
                .toList();
    }

    @Override
    public AdminUser save(AdminUser user) {
        AdminUserEntity entity = toEntity(user);
        AdminUserEntity saved = jpaRepository.save(entity);
        return toDomain(saved);
    }

    @Override
    public void deleteById(Long id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public long countEnabledUsers() {
        return jpaRepository.countByEnabledTrue();
    }

    @Override
    public void logAuthEvent(String username, String event, boolean success, String details) {
        String sql = "INSERT INTO admin_auth_events (username, event_type, success, details, event_time) " +
                     "VALUES (?, ?, ?, ?, ?)";
        jdbcTemplate.update(sql, username, event, success, details, LocalDateTime.now());
    }

    /**
     * Convert JPA entity to domain model
     */
    private AdminUser toDomain(AdminUserEntity entity) {
        List<String> roleList = entity.getRoles() != null
                ? Arrays.asList(entity.getRoles().split(","))
                : List.of();

        return new AdminUser(
                entity.getId(),
                entity.getUsername(),
                entity.getPasswordHash(),
                entity.getEmail(),
                entity.getFullName(),
                entity.isEnabled(),
                roleList,
                entity.getCreatedAt(),
                entity.getUpdatedAt(),
                entity.getLastLoginAt(),
                entity.getCreatedBy()
        );
    }

    /**
     * Convert domain model to JPA entity
     */
    private AdminUserEntity toEntity(AdminUser domain) {
        String rolesStr = String.join(",", domain.getRoles());

        return new AdminUserEntity(
                domain.getId(),
                domain.getUsername(),
                domain.getPasswordHash(),
                domain.getEmail(),
                domain.getFullName(),
                domain.isEnabled(),
                rolesStr,
                domain.getCreatedAt(),
                domain.getUpdatedAt(),
                domain.getLastLoginAt(),
                domain.getCreatedBy()
        );
    }
}
