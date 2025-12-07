package com.perundhu.infrastructure.persistence.adapter;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
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
    public ImageContribution save(ImageContribution contribution) {
        ImageContributionJpaEntity entity = mapper.toEntity(contribution);
        ImageContributionJpaEntity savedEntity = repository.save(entity);
        return mapper.toDomain(savedEntity);
    }

    @Override
    public Optional<ImageContribution> findById(String id) {
        return repository.findById(id)
                .map(mapper::toDomain);
    }

    @Override
    public List<ImageContribution> findByUserId(String userId) {
        return repository.findByUserId(userId)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public List<ImageContribution> findByStatus(String status) {
        return repository.findByStatus(status)
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        repository.deleteById(id);
    }

    @Override
    public List<ImageContribution> findAll() {
        return repository.findAll()
                .stream()
                .map(mapper::toDomain)
                .collect(Collectors.toList());
    }

    @Override
    public long count() {
        return repository.count();
    }

    @Override
    public long countByStatus(String status) {
        return repository.countByStatus(status);
    }

    @Override
    public Optional<ImageContribution> findByImageUrl(String imageUrl) {
        return repository.findByImageUrl(imageUrl)
                .map(mapper::toDomain);
    }
}