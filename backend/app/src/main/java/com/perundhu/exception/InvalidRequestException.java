package com.perundhu.exception;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

/**
 * Exception thrown when a request is invalid or malformed
 */
public class InvalidRequestException extends RuntimeException {

    private static final long serialVersionUID = 1L;
    
    // Using sealed interface for validation error types
    public sealed interface ValidationError permits FieldError, GlobalError {
        String getMessage();
    }
    
    // Using records for validation error types
    public record FieldError(String field, String message, Object rejectedValue) implements ValidationError {
        @Override
        public String getMessage() {
            return message;
        }
        
        @Override
        public String toString() {
            return String.format("Field '%s' error: %s (value: %s)", field, message, rejectedValue);
        }
    }
    
    public record GlobalError(String message) implements ValidationError {
        @Override
        public String getMessage() {
            return message;
        }
    }
    
    private final List<ValidationError> errors;
    
    public InvalidRequestException(String message) {
        super(message);
        this.errors = new ArrayList<>();
    }
    
    public InvalidRequestException(String message, Throwable cause) {
        super(message, cause);
        this.errors = new ArrayList<>();
    }
    
    public InvalidRequestException(String message, List<ValidationError> errors) {
        super(message);
        this.errors = errors;
    }
    
    public void addFieldError(String field, String message, Object rejectedValue) {
        errors.add(new FieldError(field, message, rejectedValue));
    }
    
    public void addGlobalError(String message) {
        errors.add(new GlobalError(message));
    }
    
    public List<ValidationError> getErrors() {
        return errors;
    }
    
    public Map<String, Object> getErrorResponse() {
        var response = new HashMap<String, Object>();
        response.put("message", getMessage());
        response.put("errors", errors.stream()
            .map(error -> {
                if (error instanceof FieldError fieldError) {
                    var fieldErrorMap = new HashMap<String, Object>();
                    fieldErrorMap.put("field", fieldError.field());
                    fieldErrorMap.put("message", fieldError.message());
                    fieldErrorMap.put("rejectedValue", fieldError.rejectedValue());
                    return fieldErrorMap;
                } else {
                    return Map.of("message", error.getMessage());
                }
            })
            .toList());
        return response;
    }
}