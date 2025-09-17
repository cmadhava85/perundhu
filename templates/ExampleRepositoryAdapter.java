package com.perundhu.infrastructure.adapter.out.persistence;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.infrastructure.persistence.entity.ExampleJpaEntity;
import com.perundhu.infrastructure.persistence.jpa.ExampleJpaRepository;

import lombok.RequiredArgsConstructor;

/**
 * Infrastructure Adapter Template (Persistence)
 * 
 * RULES:
 * ✅ Implement domain ports
 * ✅ Handle technical concerns (DB, mapping, transactions)
 * ✅ Map between domain models and infrastructure entities
 * ✅ Use framework annotations
 * ❌ No business logic
 * ❌ Expose framework types to domain
 */
@Component
@Transactional
@RequiredArgsConstructor
public class ExampleRepositoryAdapter implements ExampleRepository {

    private final ExampleJpaRepository jpaRepository;

    @Override
    public ExampleDomainModel save(ExampleDomainModel model) {
        ExampleJpaEntity entity = mapToJpaEntity(model);
        ExampleJpaEntity saved = jpaRepository.save(entity);
        return mapToDomainModel(saved);
    }

    @Override
    public Optional<ExampleDomainModel> findById(String id) {
        return jpaRepository.findById(id)
                .map(this::mapToDomainModel);
    }

    @Override
    public List<ExampleDomainModel> findAll() {
        return jpaRepository.findAll().stream()
                .map(this::mapToDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public List<ExampleDomainModel> findByName(String name) {
        return jpaRepository.findByNameContaining(name).stream()
                .map(this::mapToDomainModel)
                .collect(Collectors.toList());
    }

    @Override
    public void deleteById(String id) {
        jpaRepository.deleteById(id);
    }

    @Override
    public boolean existsById(String id) {
        return jpaRepository.existsById(id);
    }

    @Override
    public long count() {
        return jpaRepository.count();
    }

    // Mapping methods - crucial for hexagonal architecture
    private ExampleJpaEntity mapToJpaEntity(ExampleDomainModel model) {
        ExampleJpaEntity entity = new ExampleJpaEntity();
        entity.setId(model.getId());
        entity.setName(model.getName());
        entity.setCreatedAt(model.getCreatedAt());
        return entity;
    }

    private ExampleDomainModel mapToDomainModel(ExampleJpaEntity entity) {
        return ExampleDomainModel.restore(
                entity.getId(),
                entity.getName(),
                entity.getCreatedAt());
    }
}