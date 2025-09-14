package com.perundhu.infrastructure.persistence.adapter;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.UserTrackingSession;
import com.perundhu.domain.port.UserTrackingSessionRepository;
import com.perundhu.infrastructure.persistence.entity.UserTrackingSessionEntity;
import com.perundhu.infrastructure.persistence.repository.UserTrackingSessionJpaRepository;

/**
 * Implementation of UserTrackingSessionRepository that delegates to Spring Data
 * JPA
 */
// Remove @Repository annotation - managed by HexagonalConfig
@Transactional
public class UserTrackingSessionRepositoryAdapter implements UserTrackingSessionRepository {

    private final UserTrackingSessionJpaRepository repository;

    public UserTrackingSessionRepositoryAdapter(
            @Qualifier("repositoryPackageUserTrackingSessionJpaRepository") UserTrackingSessionJpaRepository repository) {
        this.repository = repository;
    }

    @Override
    public UserTrackingSession save(UserTrackingSession session) {
        UserTrackingSessionEntity entity = UserTrackingSessionEntity.fromDomainModel(session);
        UserTrackingSessionEntity saved = repository.save(entity);
        return saved.toDomainModel();
    }

    @Override
    public Optional<UserTrackingSession> findById(Long id) {
        return repository.findById(id)
                .map(UserTrackingSessionEntity::toDomainModel);
    }

    @Override
    public Optional<UserTrackingSession> findBySessionId(String sessionId) {
        return repository.findBySessionId(sessionId)
                .map(UserTrackingSessionEntity::toDomainModel);
    }

    @Override
    public List<UserTrackingSession> findAll() {
        return repository.findAll().stream()
                .map(UserTrackingSessionEntity::toDomainModel)
                .toList();
    }

    @Override
    public void deleteById(Long id) {
        repository.deleteById(id);
    }

    @Override
    public List<UserTrackingSession> findByUserId(String userId) {
        return repository.findByUserId(userId).stream()
                .map(UserTrackingSessionEntity::toDomainModel)
                .toList();
    }
}
