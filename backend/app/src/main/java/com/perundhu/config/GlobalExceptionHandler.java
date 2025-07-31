package com.perundhu.config;

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
import com.perundhu.exception.InvalidRequestException;
import com.perundhu.exception.ResourceNotFoundException;

import jakarta.validation.ConstraintViolationException;

/**
 * Global exception handler for the application.
 * Provides consistent error responses for various exception types.
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

        logger.error("Resource not found", ex);

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Not Found");
        body.put("message", messageService.getMessage("resource.not.found"));
        body.put("details", ex.getMessage());

        return createJsonResponse(body, HttpStatus.NOT_FOUND);
    }

    /**
     * Handle InvalidRequestException - return 400 Bad Request
     */
    @ExceptionHandler(InvalidRequestException.class)
    public ResponseEntity<Object> handleInvalidRequestException(
            InvalidRequestException ex, WebRequest request) {

        logger.error("Invalid request", ex);

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Bad Request");
        body.put("message", messageService.getMessage("validation.failed"));
        body.put("details", ex.getMessage());

        return createJsonResponse(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Handle validation errors from @Valid annotations
     */
    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex, HttpHeaders headers,
            HttpStatusCode status, WebRequest request) {

        logger.error("Validation error", ex);

        Map<String, Object> body = new HashMap<>();

        // Get all validation errors
        String errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(DefaultMessageSourceResolvable::getDefaultMessage)
                .collect(Collectors.joining(", "));

        body.put("error", "Bad Request");
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

        logger.error("Constraint violation", ex);

        Map<String, Object> body = new HashMap<>();

        // Get all constraint violations
        String errors = ex.getConstraintViolations()
                .stream()
                .map(violation -> violation.getPropertyPath() + ": " + violation.getMessage())
                .collect(Collectors.joining(", "));

        body.put("error", "Bad Request");
        body.put("message", messageService.getMessage("validation.failed"));
        body.put("details", errors);

        return createJsonResponse(body, HttpStatus.BAD_REQUEST);
    }

    /**
     * Fallback handler for all unhandled exceptions
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleAllExceptions(Exception ex, WebRequest request) {
        logger.error("Unhandled error", ex);

        Map<String, Object> body = new HashMap<>();
        body.put("error", "Internal Server Error");
        body.put("message", messageService.getMessage("server.error"));
        body.put("details", ex.getClass().getName() + ": " + ex.getMessage());

        return createJsonResponse(body, HttpStatus.INTERNAL_SERVER_ERROR);
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