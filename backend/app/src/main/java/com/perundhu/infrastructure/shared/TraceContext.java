package com.perundhu.infrastructure.shared;

import org.slf4j.MDC;

/**
 * Utility class for managing trace context in logging.
 * Provides helper methods for accessing and setting trace information.
 */
public final class TraceContext {

    public static final String TRACE_ID_KEY = "traceId";
    public static final String REQUEST_ID_KEY = "requestId";
    public static final String USER_ID_KEY = "userId";
    public static final String CLIENT_IP_KEY = "clientIp";
    public static final String OPERATION_KEY = "operation";

    private TraceContext() {
        // Utility class - no instantiation
    }

    /**
     * Get the current trace ID from MDC
     */
    public static String getTraceId() {
        String traceId = MDC.get(TRACE_ID_KEY);
        return traceId != null ? traceId : "NO_TRACE";
    }

    /**
     * Get the current request ID from MDC
     */
    public static String getRequestId() {
        String requestId = MDC.get(REQUEST_ID_KEY);
        return requestId != null ? requestId : "NO_REQUEST";
    }

    /**
     * Get the client IP from MDC
     */
    public static String getClientIp() {
        String clientIp = MDC.get(CLIENT_IP_KEY);
        return clientIp != null ? clientIp : "unknown";
    }

    /**
     * Set the user ID in MDC for tracking authenticated user actions
     */
    public static void setUserId(String userId) {
        if (userId != null && !userId.isBlank()) {
            MDC.put(USER_ID_KEY, userId);
        }
    }

    /**
     * Set an operation name for tracking specific business operations
     */
    public static void setOperation(String operation) {
        if (operation != null && !operation.isBlank()) {
            MDC.put(OPERATION_KEY, operation);
        }
    }

    /**
     * Clear the operation from MDC
     */
    public static void clearOperation() {
        MDC.remove(OPERATION_KEY);
    }

    /**
     * Add a custom context value to MDC
     */
    public static void put(String key, String value) {
        if (key != null && value != null) {
            MDC.put(key, value);
        }
    }

    /**
     * Remove a custom context value from MDC
     */
    public static void remove(String key) {
        if (key != null) {
            MDC.remove(key);
        }
    }

    /**
     * Execute a runnable with a specific operation context
     */
    public static void withOperation(String operation, Runnable runnable) {
        try {
            setOperation(operation);
            runnable.run();
        } finally {
            clearOperation();
        }
    }

    /**
     * Format a log message with trace context for external logging systems
     */
    public static String formatWithContext(String message) {
        return String.format("[traceId=%s] [requestId=%s] %s", 
            getTraceId(), getRequestId(), message);
    }
}
