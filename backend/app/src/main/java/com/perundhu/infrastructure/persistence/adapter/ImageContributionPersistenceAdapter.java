package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;

import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.infrastructure.config.CacheConfig;
import com.perundhu.infrastructure.persistence.entity.ImageContributionJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.ImageContributionJpaRepository;
import com.perundhu.infrastructure.persistence.mapper.ImageContributionMapper;

@Component
public class ImageContributionPersistenceAdapter implements ImageContributionOutputPort {

    private final ImageContributionJpaRepository repository;
    private final ImageContributionMapper mapper;

    public ImageContributionPersistenceAdapter(ImageContributionJpaRepository repository,
            ImageContributionMapper mapper) {
        this.repository = repository;
        this.mapper = mapper;
    }

    @Override
    @CacheEvict(value = {CacheConfig.IMAGE_CONTRIBUTIONS_CACHE, CacheConfig.PUBLIC_STATS_CACHE}, allEntries = true)
    public ImageContribution save(ImageContribution contribution) {
        ImageContributionJpaEntity entity = mapper.toEntity(contribution);
        ImageContributionJpaEntity savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.IMAGE_CONTRIBUTIONS_CACHE, key = "'id:' + #id")
    public Optional<ImageContribution> findById(String id) {
        return repository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.IMAGE_CONTRIBUTIONS_CACHE, key = "'userId:' + #userId")
    public List<ImageContribution> findByUserId(String userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = CacheConfig.IMAGE_CONTRIBUTIONS_CACHE, key = "'status:' + #status")
    public List<ImageContribution> findByStatus(String status) {
        return repository.findByStatus(status)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @CacheEvict(value = {CacheConfig.IMAGE_CONTRIBUTIONS_CACHE, CacheConfig.PUBLIC_STATS_CACHE}, allEntries = true)
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ImageContribution> findAll() {
        return repository.findAll()
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public long count() {
        return repository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public long countByStatus(String status) {
        return repository.countByStatus(status);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<ImageContribution> findByImageUrl(String imageUrl) {
        // Try exact match first
        Optional<ImageContribution> exact = repository.findByImageUrl(imageUrl)
                .map(mapper::toDomain);
        if (exact.isPresent()) {
            return exact;
        }

        // Fallback: search by URL suffix to handle base URL changes (dev/preprod/prod)
        int idx = imageUrl.indexOf("/api/images/");
        if (idx != -1) {
            String suffix = imageUrl.substring(idx);
            return repository.findByImageUrlEndingWith(suffix)
                    .map(mapper::toDomain);
        }

        return Optional.empty();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ImageContribution> findAllPaged(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repository.findAll(pageable)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ImageContribution> findByStatusPaged(String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return repository.findByStatus(status, pageable)
                .stream()
                .map(mapper::toDomain)
                .toList();
    }
}