package com.perundhu.application.dto;

import java.util.List;

/**
 * Model class to hold error details for API responses
 */
public class ErrorDetails {
    private String code;
    private String message;
    private List<String> details;

    public ErrorDetails() {
    }

    public ErrorDetails(String code, String message, List<String> details) {
        this.code = code;
        this.message = message;
        this.details = details;
    }

    public String getCode() {
        return code;
    }

    public void setCode(String code) {
        this.code = code;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public List<String> getDetails() {
        return details;
    }

    public void setDetails(List<String> details) {
        this.details = details;
    }
}