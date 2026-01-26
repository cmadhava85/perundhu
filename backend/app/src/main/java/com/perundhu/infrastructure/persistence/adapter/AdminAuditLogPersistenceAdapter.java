package com.perundhu.infrastructure.persistence.adapter;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.application.port.out.AdminAuditLogPersistencePort;
import com.perundhu.domain.model.AdminAuditLog;
import com.perundhu.infrastructure.persistence.entity.AdminAuditLogJpaEntity;
import com.perundhu.infrastructure.persistence.repository.AdminAuditLogRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Adapter for admin audit log persistence operations
 * Implements the output port using JPA repository
 * Following hexagonal architecture pattern
 */
@Component
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AdminAuditLogPersistenceAdapter implements AdminAuditLogPersistencePort {

    private final AdminAuditLogRepository repository;

    @Override
    public AdminAuditLog save(AdminAuditLog auditLog) {
        AdminAuditLogJpaEntity entity = AdminAuditLogJpaEntity.fromDomain(auditLog);
        AdminAuditLogJpaEntity saved = repository.save(entity);
        log.debug("Saved audit log with id: {}", saved.getId());
        return saved.toDomain();
    }

    @Override
    public Page<AdminAuditLog> findAll(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findAll(pageable).map(AdminAuditLogJpaEntity::toDomain);
    }

    @Override
    public Page<AdminAuditLog> findByAdminUsername(String adminUsername, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findByAdminUsername(adminUsername, pageable).map(AdminAuditLogJpaEntity::toDomain);
    }

    @Override
    public Page<AdminAuditLog> findByActionType(AdminAuditLog.AdminActionType actionType, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findByActionType(actionType, pageable).map(AdminAuditLogJpaEntity::toDomain);
    }

    @Override
    public Page<AdminAuditLog> findByResourceTypeAndResourceId(
            String resourceType,
            String resourceId,
            int page,
            int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findByResourceTypeAndResourceId(resourceType, resourceId, pageable)
                .map(AdminAuditLogJpaEntity::toDomain);
    }

    @Override
    public Page<AdminAuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "timestamp"));
        return repository.findByTimestampBetween(start, end, pageable).map(AdminAuditLogJpaEntity::toDomain);
    }

    @Override
    public Page<AdminAuditLog> findRecentActionsByAdmin(String adminUsername, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repository.findRecentActionsByAdmin(adminUsername, pageable).map(AdminAuditLogJpaEntity::toDomain);
    }

    @Override
    public List<Object[]> getActionTypeStatistics(LocalDateTime since) {
        return repository.getActionTypeStatistics(since);
    }

    @Override
    public List<Object[]> findSuspiciousActivities(LocalDateTime since, int limit) {
        return repository.findSuspiciousActivities(since, limit);
    }

    @Override
    public long count() {
        return repository.count();
    }
}
