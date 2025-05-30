package com.perundhu.exception;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;

/**
 * Exception thrown when a business rule is violated
 */
@Getter
public class BusinessException extends RuntimeException {
    
    private final String errorCode;
    private final List<String> details;
    
    public BusinessException(String message) {
        super(message);
        this.errorCode = "BUSINESS_ERROR";
        this.details = new ArrayList<>();
    }
    
    public BusinessException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
        this.details = new ArrayList<>();
    }
    
    public BusinessException(String message, String errorCode, List<String> details) {
        super(message);
        this.errorCode = errorCode;
        this.details = details;
    }
}