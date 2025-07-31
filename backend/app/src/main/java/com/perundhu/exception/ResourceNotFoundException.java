package com.perundhu.exception;

/**
 * Exception thrown when a requested resource cannot be found
 * Modernized to use Java 17 features without Lombok
 */
public class ResourceNotFoundException extends RuntimeException {
    
    // Using record for resource identification
    public record ResourceIdentifier(String resourceName, String fieldName, Object fieldValue) {
        @Override
        public String toString() {
            return String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue);
        }
    }
    
    private final ResourceIdentifier resourceIdentifier;

    public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
        super(String.format("%s not found with %s: '%s'", resourceName, fieldName, fieldValue));
        this.resourceIdentifier = new ResourceIdentifier(resourceName, fieldName, fieldValue);
    }
    
    public ResourceNotFoundException(ResourceIdentifier resourceIdentifier) {
        super(resourceIdentifier.toString());
        this.resourceIdentifier = resourceIdentifier;
    }
    
    // Explicit getter instead of Lombok @Getter
    public ResourceIdentifier getResourceIdentifier() {
        return resourceIdentifier;
    }

    // Convenience getters to maintain backward compatibility
    public String getResourceName() {
        return resourceIdentifier.resourceName();
    }
    
    public String getFieldName() {
        return resourceIdentifier.fieldName();
    }
    
    public Object getFieldValue() {
        return resourceIdentifier.fieldValue();
    }
}

