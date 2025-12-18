package com.perundhu.infrastructure.config;

import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.support.DefaultMessageSourceResolvable;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import com.perundhu.domain.port.MessageService;
import com.perundhu.exception.BusinessException;
import com.perundhu.exception.InvalidRequestException;
import com.perundhu.exception.ResourceNotFoundException;
import com.perundhu.infrastructure.exception.RateLimitException;
import com.perundhu.infrastructure.shared.TraceContext;

import jakarta.validation.ConstraintViolationException;

/**
 * Global exception handler for the application.
 * Provides consistent error responses for various exception types.
 * All responses include traceId for request correlation.
 */
@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final MessageService messageService;

    public GlobalExceptionHandler(MessageService messageService) {
        this.messageService = messageService;
    }

    // Getter for testing
    protected MessageService getMessageService() {
        return messageService;
    }

    /**
     * Handle ResourceNotFoundException - return 404 Not Found
     */
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Object> handleResourceNotFoundException(
            ResourceNotFoundException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();
        logger.error("[EXCEPTION][traceId={}] ResourceNotFoundException: {} | path={}",
                traceId, ex.getMessage(), request.getDescription(false));

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Not Found");
        body.put("errorCode", "RESOURCE_NOT_FOUND");
        body.put("message", messageService.getMessage("resource.not.found"));
        body.put("userMessage",
                "The requested item could not be found. It may have been removed or the link is incorrect.");
        body.put("details", ex.getMessage());

        return createJsonResponse(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle InvalidRequestException - return 400 Bad Request
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Object> handleInvalidRequestException(
            InvalidRequestException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();
        logger.error("[EXCEPTION][traceId={}] InvalidRequestException: {} | path={}",
                traceId, ex.getMessage(), request.getDescription(false));

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Bad Request");
        body.put("message", messageService.getMessage("validation.failed"));
        body.put("userMessage", "Please check your input and try again.");
        body.put("details", ex.getMessage());

        return createJsonResponse(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle BusinessException - return 422 Unprocessable Entity
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<Object> handleBusinessException(
            BusinessException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();
        logger.error("[EXCEPTION][traceId={}] BusinessException: errorCode={} | message={} | path={}",
                traceId, ex.getErrorCode(), ex.getMessage(), request.getDescription(false));

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Business Rule Violation");
        body.put("errorCode", ex.getErrorCode());
        body.put("message", ex.getMessage());
        body.put("userMessage", getUserFriendlyBusinessMessage(ex.getErrorCode(), ex.getMessage()));
        if (!ex.getDetails().isEmpty()) {
            body.put("details", ex.getDetails());
        }

        return createJsonResponse(body, HttpStatus.UNPROCESSABLE_ENTITY);
    }

    /**
     * Handle RateLimitException - return 429 Too Many Requests
     */
    @ExceptionHandler(RateLimitException.class)
    public ResponseEntity<Object> handleRateLimitException(
            RateLimitException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();
        logger.warn("[EXCEPTION][traceId={}] RateLimitException: {} | clientIp={} | path={}",
                traceId, ex.getMessage(), TraceContext.getClientIp(), request.getDescription(false));

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Too Many Requests");
        body.put("errorCode", "RATE_LIMIT_EXCEEDED");
        body.put("message", ex.getMessage());
        body.put("userMessage", "You're making too many requests. Please wait a moment and try again.");
        body.put("retryAfter", 60); // Suggest retry after 60 seconds

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.add("Retry-After", "60");

        return new ResponseEntity<>(body, headers, HttpStatus.TOO_MANY_REQUESTS);
    }

    /**
     * Handle validation errors from @Valid annotations
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {

        String traceId = TraceContext.getTraceId();

        // Get all validation errors
        String errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining(", "));

        logger.error("[EXCEPTION][traceId={}] ValidationException: {} | path={}",
                traceId, errors, request.getDescription(false));

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Bad Request");
        body.put("errorCode", "VALIDATION_ERROR");
        body.put("message", messageService.getMessage("validation.failed"));
        body.put("details", errors);

        return createJsonResponse(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle constraint violations
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<Object> handleConstraintViolationException(
            ConstraintViolationException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();

        // Get all constraint violations
        String errors = ex.getConstraintViolations()
                .stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(Collectors.joining(", "));

        logger.error("[EXCEPTION][traceId={}] ConstraintViolationException: {} | path={}",
                traceId, errors, request.getDescription(false));

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Bad Request");
        body.put("errorCode", "CONSTRAINT_VIOLATION");
        body.put("message", messageService.getMessage("validation.failed"));
        body.put("details", errors);

        return createJsonResponse(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle IllegalArgumentException - return 400 Bad Request
     */
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();
        logger.error("[EXCEPTION][traceId={}] IllegalArgumentException: {} | path={}",
                traceId, ex.getMessage(), request.getDescription(false), ex);

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Bad Request");
        body.put("errorCode", "ILLEGAL_ARGUMENT");
        body.put("message", ex.getMessage());
        body.put("userMessage", "The provided input is invalid. Please check and try again.");

        return createJsonResponse(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle NullPointerException - return 500 Internal Server Error
     */
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<Object> handleNullPointerException(
            NullPointerException ex, WebRequest request) {

        String traceId = TraceContext.getTraceId();
        logger.error("[EXCEPTION][traceId={}] NullPointerException at {} | path={}",
                traceId, getExceptionLocation(ex), request.getDescription(false), ex);

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Internal Server Error");
        body.put("errorCode", "NULL_POINTER_ERROR");
        body.put("message", messageService.getMessage("server.error"));
        body.put("userMessage",
                "An unexpected error occurred. Please try again later. If the problem persists, contact support with traceId: "
                        + traceId);

        return createJsonResponse(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Fallback handler for all unhandled exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        String traceId = TraceContext.getTraceId();

        logger.error("[EXCEPTION][traceId={}] UnhandledException: type={} | message={} | path={}",
                traceId, ex.getClass().getSimpleName(), ex.getMessage(), request.getDescription(false), ex);

        Map<String, Object> body = new HashMap<>();
        body.put("traceId", traceId);
        body.put("error", "Internal Server Error");
        body.put("errorCode", "INTERNAL_ERROR");
        body.put("message", messageService.getMessage("server.error"));
        body.put("userMessage",
                "Something went wrong on our end. Please try again later or contact support with traceId: " + traceId);
        // Only include technical details in non-production environments
        if (logger.isDebugEnabled()) {
            body.put("details", ex.getClass().getName() + ": " + ex.getMessage());
        }

        return createJsonResponse(body, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    /**
     * Get exception location for NullPointerException debugging
     */
    private String getExceptionLocation(Exception ex) {
        StackTraceElement[] stackTrace = ex.getStackTrace();
        if (stackTrace != null && stackTrace.length > 0) {
            StackTraceElement element = stackTrace[0];
            return element.getClassName() + "." + element.getMethodName() +
                    "(" + element.getFileName() + ":" + element.getLineNumber() + ")";
        }
        return "unknown";
    }

    /**
     * Get user-friendly message for business exceptions
     */
    private String getUserFriendlyBusinessMessage(String errorCode, String defaultMessage) {
        return switch (errorCode) {
            case "DUPLICATE_ENTRY" -> "This item already exists. Please use a different value.";
            case "INVALID_OPERATION" -> "This operation is not allowed at this time.";
            case "QUOTA_EXCEEDED" -> "You've reached your limit. Please try again later.";
            case "DATA_INTEGRITY_ERROR" -> "The data you provided conflicts with existing records.";
            case "VALIDATION_ERROR" -> "Please check your input and correct any errors.";
            default -> defaultMessage != null ? defaultMessage : "A business rule prevented this action.";
        };
    }

    /**
     * Helper method to ensure responses are always JSON
     */
    private ResponseEntity<Object> createJsonResponse(Map<String, Object> body, HttpStatus status) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        return new ResponseEntity<>(body, headers, status);
    }
}