package com.perundhu.application.dto;

import java.util.List;
/**
 * Generic wrapper for all API responses
 */
public class ApiResponse<T> {
    private boolean success;
    private String message;
    private ErrorDetails error;
    private T data;
    private String path;

    public ApiResponse() {
    }

    public ApiResponse(boolean success, String message, ErrorDetails error, T data, String path) {
        this.success = success;
        this.message = message;
        this.error = error;
        this.data = data;
        this.path = path;
    }

    public static <T> ApiResponse<T> success(String message, T data) {
        return new ApiResponse<>(true, message, null, data, null);
    }

    public static <T> ApiResponse<T> error(String message, String errorCode) {
        ErrorDetails error = new ErrorDetails(errorCode, message, null);
        return new ApiResponse<>(false, message, error, null, null);
    }
    
    public static <T> ApiResponse<T> error(String message, String errorCode, List<String> details) {
        ErrorDetails error = new ErrorDetails(errorCode, message, details);
        return new ApiResponse<>(false, message, error, null, null);
    }

    public boolean isSuccess() {
        return success;
    }

    public void setSuccess(boolean success) {
        this.success = success;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public ErrorDetails getError() {
        return error;
    }

    public void setError(ErrorDetails error) {
        this.error = error;
    }

    public T getData() {
        return data;
    }

    public void setData(T data) {
        this.data = data;
    }

    public String getPath() {
        return path;
    }

    public void setPath(String path) {
        this.path = path;
    }
}