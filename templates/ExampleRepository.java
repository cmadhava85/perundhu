package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

/**
 * Domain Port Template (Output Port)
 * 
 * RULES:
 * ✅ Define contracts for external dependencies
 * ✅ Only use domain types in method signatures
 * ✅ No implementation details
 * ❌ No framework-specific types
 * ❌ No infrastructure imports
 */
public interface ExampleRepository {

  /**
   * Save a domain model
   */
  ExampleDomainModel save(ExampleDomainModel model);

  /**
   * Find by ID
   */
  Optional<ExampleDomainModel> findById(String id);

  /**
   * Find all models
   */
  List<ExampleDomainModel> findAll();

  /**
   * Find by business criteria
   */
  List<ExampleDomainModel> findByName(String name);

  /**
   * Delete by ID
   */
  void deleteById(String id);

  /**
   * Check existence
   */
  boolean existsById(String id);

  /**
   * Count all
   */
  long count();
}