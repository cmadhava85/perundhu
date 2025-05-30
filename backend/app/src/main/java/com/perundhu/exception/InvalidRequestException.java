package com.perundhu.exception;

/**
 * Exception thrown when a request is invalid or malformed
 */
public class InvalidRequestException extends RuntimeException {

    private static final long serialVersionUID = 1L;
    
    public InvalidRequestException(String message) {
        super(message);
    }
    
    public InvalidRequestException(String message, Throwable cause) {
        super(message, cause);
    }
}