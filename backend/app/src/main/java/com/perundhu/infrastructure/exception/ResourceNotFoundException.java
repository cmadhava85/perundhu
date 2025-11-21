package com.perundhu.infrastructure.exception;

/**
 * Exception thrown when a requested resource is not found
 */
public class ResourceNotFoundException extends RuntimeException {

  public ResourceNotFoundException(String message) {
    super(message);
  }

  public ResourceNotFoundException(String resourceName, Object id) {
    super(String.format("%s not found with id: %s", resourceName, id));
  }

  public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
    super(String.format("%s not found with %s: %s", resourceName, fieldName, fieldValue));
  }
}
