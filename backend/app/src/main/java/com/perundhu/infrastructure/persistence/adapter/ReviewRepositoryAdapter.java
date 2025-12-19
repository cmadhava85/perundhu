package com.perundhu.infrastructure.persistence.adapter;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Review;
import com.perundhu.domain.model.ReviewId;
import com.perundhu.domain.port.ReviewRepository;
import com.perundhu.infrastructure.persistence.entity.ReviewJpaEntity;
import com.perundhu.infrastructure.persistence.entity.ReviewJpaEntity.ReviewStatus;
import com.perundhu.infrastructure.persistence.jpa.ReviewJpaRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Repository adapter for Review persistence.
 * Implements the domain port using JPA repository.
 * Following hexagonal architecture pattern.
 */
@Transactional
@RequiredArgsConstructor
@Slf4j
public class ReviewRepositoryAdapter implements ReviewRepository {
    
    private final ReviewJpaRepository jpaRepository;
    
    @Override
    public Review save(Review review) {
        ReviewJpaEntity entity = toEntity(review);
        ReviewJpaEntity saved = jpaRepository.save(entity);
        log.debug("Saved review with id: {}", saved.getId());
        return toDomain(saved);
    }
    
    @Override
    public Optional<Review> findById(ReviewId id) {
        return jpaRepository.findById(id.getValue()).map(this::toDomain);
    }
    
    @Override
    public List<Review> findApprovedByBusId(Long busId) {
        return jpaRepository.findByBusIdAndStatus(busId, ReviewStatus.APPROVED)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Review> findByBusId(Long busId) {
        return jpaRepository.findByBusId(busId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Review> findByUserId(String userId) {
        return jpaRepository.findByUserId(userId)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public List<Review> findPendingReviews() {
        return jpaRepository.findByStatusOrderByCreatedAtDesc(ReviewStatus.PENDING)
                .stream()
                .map(this::toDomain)
                .collect(Collectors.toList());
    }
    
    @Override
    public boolean existsByBusIdAndUserId(Long busId, String userId) {
        return jpaRepository.existsByBusIdAndUserId(busId, userId);
    }
    
    @Override
    public Double calculateAverageRating(Long busId) {
        return jpaRepository.calculateAverageRating(busId).orElse(null);
    }
    
    @Override
    public long countApprovedByBusId(Long busId) {
        return jpaRepository.countByBusIdAndStatus(busId, ReviewStatus.APPROVED);
    }
    
    @Override
    public void deleteById(ReviewId id) {
        jpaRepository.deleteById(id.getValue());
        log.debug("Deleted review with id: {}", id.getValue());
    }
    
    // ============ Mapping Methods ============
    
    private Review toDomain(ReviewJpaEntity entity) {
        return Review.builder()
                .id(entity.getId())
                .busId(entity.getBusId())
                .userId(entity.getUserId())
                .rating(entity.getRating())
                .comment(entity.getComment())
                .tags(parseTags(entity.getTags()))
                .travelDate(entity.getTravelDate())
                .status(toDomainStatus(entity.getStatus()))
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
    
    private ReviewJpaEntity toEntity(Review domain) {
        return ReviewJpaEntity.builder()
                .id(domain.getId() != null ? domain.getId().getValue() : null)
                .busId(domain.getBusId())
                .userId(domain.getUserId())
                .rating(domain.getRating())
                .comment(domain.getComment())
                .tags(serializeTags(domain.getTags()))
                .travelDate(domain.getTravelDate())
                .status(toEntityStatus(domain.getStatus()))
                .createdAt(domain.getCreatedAt())
                .updatedAt(domain.getUpdatedAt())
                .build();
    }
    
    private Review.ReviewStatus toDomainStatus(ReviewStatus status) {
        return switch (status) {
            case PENDING -> Review.ReviewStatus.PENDING;
            case APPROVED -> Review.ReviewStatus.APPROVED;
            case REJECTED -> Review.ReviewStatus.REJECTED;
        };
    }
    
    private ReviewStatus toEntityStatus(Review.ReviewStatus status) {
        return switch (status) {
            case PENDING -> ReviewStatus.PENDING;
            case APPROVED -> ReviewStatus.APPROVED;
            case REJECTED -> ReviewStatus.REJECTED;
        };
    }
    
    private List<String> parseTags(String tagsJson) {
        if (tagsJson == null || tagsJson.isBlank()) {
            return Collections.emptyList();
        }
        // Simple comma-separated parsing
        return Arrays.stream(tagsJson.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toList());
    }
    
    private String serializeTags(List<String> tags) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        return String.join(",", tags);
    }
}
