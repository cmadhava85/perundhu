package com.perundhu.infrastructure.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Structured logging utility that provides consistent log formatting
 * with trace context, operation tracking, and structured data.
 * 
 * Features:
 * - Automatic traceId inclusion in all logs
 * - Operation-scoped logging with timing
 * - Structured key-value logging
 * - Exception logging with full context
 * - Module-specific logging support
 */
public class StructuredLogger {

  private final Logger logger;
  private final String module;

  private StructuredLogger(Class<?> clazz, String module) {
    this.logger = LoggerFactory.getLogger(clazz);
    this.module = module;
  }

  /**
   * Create a logger for a specific class and module
   */
  public static StructuredLogger getLogger(Class<?> clazz, String module) {
    return new StructuredLogger(clazz, module);
  }

  /**
   * Create a logger for a specific class (module inferred from package)
   */
  public static StructuredLogger getLogger(Class<?> clazz) {
    String module = inferModule(clazz);
    return new StructuredLogger(clazz, module);
  }

  private static String inferModule(Class<?> clazz) {
    String packageName = clazz.getPackageName();
    if (packageName.contains(".adapter.in.rest"))
      return "REST";
    if (packageName.contains(".adapter.in"))
      return "ADAPTER";
    if (packageName.contains(".application.service"))
      return "SERVICE";
    if (packageName.contains(".domain"))
      return "DOMAIN";
    if (packageName.contains(".infrastructure.persistence"))
      return "PERSISTENCE";
    if (packageName.contains(".infrastructure.adapter"))
      return "INFRASTRUCTURE";
    if (packageName.contains(".infrastructure.security"))
      return "SECURITY";
    if (packageName.contains(".infrastructure.config"))
      return "CONFIG";
    return "GENERAL";
  }

  // ========== DEBUG ==========

  public void debug(String message) {
    if (logger.isDebugEnabled()) {
      logger.debug(formatMessage(message));
    }
  }

  public void debug(String message, Object... args) {
    if (logger.isDebugEnabled()) {
      logger.debug(formatMessage(message), args);
    }
  }

  public void debugWithData(String message, Map<String, Object> data) {
    if (logger.isDebugEnabled()) {
      logger.debug(formatMessageWithData(message, data));
    }
  }

  // ========== INFO ==========

  public void info(String message) {
    logger.info(formatMessage(message));
  }

  public void info(String message, Object... args) {
    logger.info(formatMessage(message), args);
  }

  public void infoWithData(String message, Map<String, Object> data) {
    logger.info(formatMessageWithData(message, data));
  }

  // ========== WARN ==========

  public void warn(String message) {
    logger.warn(formatMessage(message));
  }

  public void warn(String message, Object... args) {
    logger.warn(formatMessage(message), args);
  }

  public void warnWithData(String message, Map<String, Object> data) {
    logger.warn(formatMessageWithData(message, data));
  }

  public void warn(String message, Throwable t) {
    logger.warn(formatMessage(message), t);
  }

  // ========== ERROR ==========

  public void error(String message) {
    logger.error(formatMessage(message));
  }

  public void error(String message, Object... args) {
    logger.error(formatMessage(message), args);
  }

  public void error(String message, Throwable t) {
    logger.error(formatExceptionMessage(message, t), t);
  }

  public void errorWithData(String message, Map<String, Object> data) {
    logger.error(formatMessageWithData(message, data));
  }

  public void errorWithData(String message, Map<String, Object> data, Throwable t) {
    logger.error(formatMessageWithData(message, data), t);
  }

  // ========== OPERATION LOGGING ==========

  /**
   * Log operation start
   */
  public void operationStart(String operation) {
    TraceContext.setOperation(operation);
    info("OPERATION_START: {}", operation);
  }

  /**
   * Log operation completion with duration
   */
  public void operationComplete(String operation, long startTime) {
    long duration = System.currentTimeMillis() - startTime;
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("operation", operation);
    data.put("durationMs", duration);
    data.put("status", "SUCCESS");
    infoWithData("OPERATION_COMPLETE", data);
    TraceContext.clearOperation();
  }

  /**
   * Log operation failure
   */
  public void operationFailed(String operation, long startTime, Throwable t) {
    long duration = System.currentTimeMillis() - startTime;
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("operation", operation);
    data.put("durationMs", duration);
    data.put("status", "FAILED");
    data.put("errorType", t.getClass().getSimpleName());
    data.put("errorMessage", t.getMessage());
    errorWithData("OPERATION_FAILED", data, t);
    TraceContext.clearOperation();
  }

  // ========== REQUEST/RESPONSE LOGGING ==========

  /**
   * Log incoming request
   */
  public void logRequest(String method, String path, Map<String, Object> params) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("method", method);
    data.put("path", path);
    if (params != null && !params.isEmpty()) {
      data.put("params", params);
    }
    infoWithData("REQUEST", data);
  }

  /**
   * Log response
   */
  public void logResponse(String method, String path, int status, long durationMs) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("method", method);
    data.put("path", path);
    data.put("status", status);
    data.put("durationMs", durationMs);
    if (status >= 400) {
      warnWithData("RESPONSE", data);
    } else {
      infoWithData("RESPONSE", data);
    }
  }

  // ========== SEARCH MODULE LOGGING ==========

  public void logSearchRequest(String fromLocation, String toLocation, String userId) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("from", fromLocation);
    data.put("to", toLocation);
    data.put("userId", userId);
    infoWithData("SEARCH_REQUEST", data);
  }

  public void logSearchResults(String fromLocation, String toLocation, int resultCount, long durationMs) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("from", fromLocation);
    data.put("to", toLocation);
    data.put("resultCount", resultCount);
    data.put("durationMs", durationMs);
    infoWithData("SEARCH_RESULTS", data);
  }

  // ========== CONTRIBUTION MODULE LOGGING ==========

  public void logContributionSubmit(String type, String userId, String source) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("type", type);
    data.put("userId", userId);
    data.put("source", source);
    infoWithData("CONTRIBUTION_SUBMIT", data);
  }

  public void logContributionProcess(String contributionId, String status, String message) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("contributionId", contributionId);
    data.put("status", status);
    data.put("message", message);
    infoWithData("CONTRIBUTION_PROCESS", data);
  }

  // ========== ADMIN MODULE LOGGING ==========

  public void logAdminAction(String action, String targetType, String targetId, String adminId) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("action", action);
    data.put("targetType", targetType);
    data.put("targetId", targetId);
    data.put("adminId", adminId);
    infoWithData("ADMIN_ACTION", data);
  }

  // ========== DATABASE LOGGING ==========

  public void logDbQuery(String operation, String entity, int resultCount, long durationMs) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("operation", operation);
    data.put("entity", entity);
    data.put("resultCount", resultCount);
    data.put("durationMs", durationMs);
    debugWithData("DB_QUERY", data);
  }

  // ========== EXTERNAL SERVICE LOGGING ==========

  public void logExternalCall(String service, String operation, boolean success, long durationMs) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("service", service);
    data.put("operation", operation);
    data.put("success", success);
    data.put("durationMs", durationMs);
    if (success) {
      infoWithData("EXTERNAL_CALL", data);
    } else {
      warnWithData("EXTERNAL_CALL", data);
    }
  }

  public void logExternalCallError(String service, String operation, Throwable t) {
    Map<String, Object> data = new LinkedHashMap<>();
    data.put("service", service);
    data.put("operation", operation);
    data.put("success", false);
    data.put("errorType", t.getClass().getSimpleName());
    data.put("errorMessage", t.getMessage());
    errorWithData("EXTERNAL_CALL_ERROR", data, t);
  }

  // ========== FORMATTING HELPERS ==========

  private String formatMessage(String message) {
    String traceId = MDC.get(TraceContext.TRACE_ID_KEY);
    String operation = MDC.get(TraceContext.OPERATION_KEY);

    StringBuilder sb = new StringBuilder();
    sb.append("[").append(module).append("]");
    if (traceId != null) {
      sb.append("[traceId=").append(traceId).append("]");
    }
    if (operation != null) {
      sb.append("[op=").append(operation).append("]");
    }
    sb.append(" ").append(message);
    return sb.toString();
  }

  private String formatMessageWithData(String message, Map<String, Object> data) {
    StringBuilder sb = new StringBuilder(formatMessage(message));
    if (data != null && !data.isEmpty()) {
      sb.append(" |");
      data.forEach((key, value) -> {
        sb.append(" ").append(key).append("=");
        if (value == null) {
          sb.append("null");
        } else if (value instanceof String) {
          sb.append("\"").append(value).append("\"");
        } else {
          sb.append(value);
        }
      });
    }
    return sb.toString();
  }

  private String formatExceptionMessage(String message, Throwable t) {
    String formatted = formatMessage(message);
    if (t != null) {
      return formatted + " | error=" + t.getClass().getSimpleName() +
          " | errorMessage=\"" + t.getMessage() + "\"";
    }
    return formatted;
  }

  // ========== CONVENIENCE METHODS ==========

  /**
   * Create a data map builder for structured logging
   */
  public static DataBuilder data() {
    return new DataBuilder();
  }

  public static class DataBuilder {
    private final Map<String, Object> data = new LinkedHashMap<>();

    public DataBuilder put(String key, Object value) {
      data.put(key, value);
      return this;
    }

    public Map<String, Object> build() {
      return data;
    }
  }
}
