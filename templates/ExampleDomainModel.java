package com.perundhu.domain.model;

import java.time.LocalDateTime;

/**
 * Domain Model Template
 * 
 * RULES:
 * ✅ Pure business logic only
 * ✅ No framework dependencies (Spring, JPA, etc.)
 * ✅ Can only depend on other domain models
 * ❌ No infrastructure imports
 * ❌ No annotations except basic Java ones
 */
public class ExampleDomainModel {

  private final String id;
  private final String name;
  private final LocalDateTime createdAt;

  // Constructor with validation
  private ExampleDomainModel(String id, String name, LocalDateTime createdAt) {
    if (id == null || id.isBlank()) {
      throw new IllegalArgumentException("ID cannot be null or empty");
    }
    if (name == null || name.isBlank()) {
      throw new IllegalArgumentException("Name cannot be null or empty");
    }

    this.id = id;
    this.name = name;
    this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
  }

  // Factory method (preferred over constructors)
  public static ExampleDomainModel create(String id, String name) {
    return new ExampleDomainModel(id, name, LocalDateTime.now());
  }

  public static ExampleDomainModel restore(String id, String name, LocalDateTime createdAt) {
    return new ExampleDomainModel(id, name, createdAt);
  }

  // Business methods
  public boolean isRecent() {
    return createdAt.isAfter(LocalDateTime.now().minusDays(7));
  }

  public ExampleDomainModel withUpdatedName(String newName) {
    return new ExampleDomainModel(this.id, newName, this.createdAt);
  }

  // Getters (no setters for immutability)
  public String getId() {
    return id;
  }

  public String getName() {
    return name;
  }

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  @Override
  public boolean equals(Object obj) {
    if (this == obj)
      return true;
    if (obj == null || getClass() != obj.getClass())
      return false;

    ExampleDomainModel that = (ExampleDomainModel) obj;
    return id.equals(that.id);
  }

  @Override
  public int hashCode() {
    return id.hashCode();
  }

  @Override
  public String toString() {
    return "ExampleDomainModel{" +
        "id='" + id + '\'' +
        ", name='" + name + '\'' +
        ", createdAt=" + createdAt +
        '}';
  }
}