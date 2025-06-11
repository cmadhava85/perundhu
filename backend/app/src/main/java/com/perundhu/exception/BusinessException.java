package com.perundhu.exception;

import java.util.ArrayList;
import java.util.List;

import lombok.Getter;

/**
 * Exception thrown when a business rule is violated
 */
@Getter
public class BusinessException extends RuntimeException {
    
    // Using record for error details
    public record ErrorDetail(String code, String message) {}
    
    private final String errorCode;
    private final List<ErrorDetail> details;
    
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
        // Using stream with mapping to convert string details to ErrorDetail records
        this.details = details.stream()
            .map(detail -> new ErrorDetail("DETAIL", detail))
            .toList();
    }
    
    public BusinessException(String message, String errorCode, List<ErrorDetail> details, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
        this.details = details;
    }
    
    /**
     * Add a detail to the exception
     */
    public void addDetail(String detail) {
        this.details.add(new ErrorDetail("DETAIL", detail));
    }
    
    /**
     * Add a detail with a specific code to the exception
     */
    public void addDetail(String code, String detail) {
        this.details.add(new ErrorDetail(code, detail));
    }
}