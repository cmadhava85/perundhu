package com.perundhu.application.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.perundhu.application.port.input.ExampleInputPort;

import lombok.RequiredArgsConstructor;

/**
 * Application Service Template
 * 
 * RULES:
 * ✅ Orchestrate business use cases
 * ✅ Only import from domain layer
 * ✅ Use domain ports for external dependencies
 * ❌ No business logic (delegate to domain)
 * ❌ No infrastructure imports
 * ❌ No technical concerns (DB, web, etc.)
 */
@Service
@RequiredArgsConstructor
public class ExampleApplicationService implements ExampleInputPort {

    private final ExampleRepository repository;

    @Override
    public ExampleDomainModel createExample(String name) {
        // Validation can be here or in domain
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        // Create domain model (business logic is in domain)
        ExampleDomainModel model = ExampleDomainModel.create(
                generateId(), // This could be injected as a domain service
                name);

        // Save using domain port
        return repository.save(model);
    }

    @Override
    public Optional<ExampleDomainModel> findById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID is required");
        }

        return repository.findById(id);
    }

    @Override
    public List<ExampleDomainModel> findByName(String name) {
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("Name is required");
        }

        return repository.findByName(name);
    }

    @Override
    public ExampleDomainModel updateName(String id, String newName) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID is required");
        }
        if (newName == null || newName.isBlank()) {
            throw new IllegalArgumentException("New name is required");
        }

        ExampleDomainModel existing = repository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Model not found: " + id));

        // Business logic: update using domain method
        ExampleDomainModel updated = existing.withUpdatedName(newName);

        return repository.save(updated);
    }

    @Override
    public void deleteById(String id) {
        if (id == null || id.isBlank()) {
            throw new IllegalArgumentException("ID is required");
        }

        if (!repository.existsById(id)) {
            throw new IllegalArgumentException("Model not found: " + id);
        }

        repository.deleteById(id);
    }

    // Helper method - could be injected as domain service
    private String generateId() {
        return java.util.UUID.randomUUID().toString();
    }
}