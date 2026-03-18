package com.perundhu.adapter.out.persistence;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.perundhu.infrastructure.persistence.entity.UserFeedbackJpaEntity;
import com.perundhu.infrastructure.persistence.repository.UserFeedbackRepository;
import com.perundhu.domain.model.UserFeedback;
import com.perundhu.domain.port.UserFeedbackOutputPort;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Persistence adapter for UserFeedback.
 * Implements the output port to save and retrieve feedback from the database.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class UserFeedbackPersistenceAdapter implements UserFeedbackOutputPort {

    private final UserFeedbackRepository feedbackRepository;

    @Override
    public UserFeedback saveFeedback(UserFeedback feedback) {
        log.info("Saving feedback from email: {}", feedback.getEmail());
        
        UserFeedbackJpaEntity entity = mapToEntity(feedback);
        UserFeedbackJpaEntity saved = feedbackRepository.save(entity);
        
        log.info("Feedback saved with ID: {}", saved.getId());
        return mapToDomain(saved);
    }

    @Override
    public Optional<UserFeedback> findFeedbackById(Long id) {
        return feedbackRepository.findById(id)
                .map(this::mapToDomain);
    }

    @Override
    public List<UserFeedback> findFeedbackByEmail(String email) {
        return feedbackRepository.findByEmail(email)
                .stream()
                .map(this::mapToDomain)
                .toList();
    }

    @Override
    public List<UserFeedback> findFeedbackByCategory(String category) {
        return feedbackRepository.findByCategory(category)
                .stream()
                .map(this::mapToDomain)
                .toList();
    }

    @Override
    public List<UserFeedback> findFeedbackByStatus(String status) {
        UserFeedbackJpaEntity.FeedbackStatus feedbackStatus =
                UserFeedbackJpaEntity.FeedbackStatus.valueOf(status.toUpperCase());
        return feedbackRepository.findByStatus(feedbackStatus)
                .stream()
                .map(this::mapToDomain)
                .toList();
    }

    @Override
    public List<UserFeedback> findRecentFeedback(int limit) {
        return feedbackRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, limit))
                .getContent()
                .stream()
                .map(this::mapToDomain)
                .toList();
    }

    @Override
    public long countFeedbackByStatus(String status) {
        UserFeedbackJpaEntity.FeedbackStatus feedbackStatus =
                UserFeedbackJpaEntity.FeedbackStatus.valueOf(status.toUpperCase());
        return feedbackRepository.countByStatus(feedbackStatus);
    }

    @Override
    public long countFeedbackByCategory(String category) {
        return feedbackRepository.countByCategory(category);
    }

    @Override
    public UserFeedback updateFeedbackStatus(Long id, String status) {
        return feedbackRepository.findById(id)
                .map(entity -> {
                    entity.setStatus(UserFeedbackJpaEntity.FeedbackStatus.valueOf(status.toUpperCase()));
                    entity.setUpdatedAt(LocalDateTime.now());
                    return feedbackRepository.save(entity);
                })
                .map(this::mapToDomain)
                .orElseThrow(() -> new IllegalArgumentException("Feedback not found: " + id));
    }

    /**
     * Map JPA entity to domain model
     */
    private UserFeedback mapToDomain(UserFeedbackJpaEntity entity) {
        return UserFeedback.builder()
                .id(entity.getId())
                .category(entity.getCategory())
                .message(entity.getMessage())
                .email(entity.getEmail())
                .screenshotFilename(entity.getScreenshotFilename())
                .screenshotUrl(entity.getScreenshotUrl())
                .userAgent(entity.getUserAgent())
                .pageUrl(entity.getPageUrl())
                .ipAddress(entity.getIpAddress())
                .status(entity.getStatus() != null ? 
                        UserFeedback.FeedbackStatus.valueOf(entity.getStatus().name()) : 
                        UserFeedback.FeedbackStatus.NEW)
                .adminNotes(entity.getAdminNotes())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .reviewedAt(entity.getReviewedAt())
                .reviewedBy(entity.getReviewedBy())
                .build();
    }

    /**
     * Map domain model to JPA entity
     */
    private UserFeedbackJpaEntity mapToEntity(UserFeedback feedback) {
        return UserFeedbackJpaEntity.builder()
                .id(feedback.getId())
                .category(feedback.getCategory())
                .message(feedback.getMessage())
                .email(feedback.getEmail())
                .screenshotFilename(feedback.getScreenshotFilename())
                .screenshotUrl(feedback.getScreenshotUrl())
                .userAgent(feedback.getUserAgent())
                .pageUrl(feedback.getPageUrl())
                .ipAddress(feedback.getIpAddress())
                .status(feedback.getStatus() != null ? 
                        UserFeedbackJpaEntity.FeedbackStatus.valueOf(feedback.getStatus().name()) : 
                        UserFeedbackJpaEntity.FeedbackStatus.NEW)
                .adminNotes(feedback.getAdminNotes())
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .reviewedAt(feedback.getReviewedAt())
                .reviewedBy(feedback.getReviewedBy())
                .build();
    }
}
