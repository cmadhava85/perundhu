package com.perundhu.infrastructure.logging;

import java.util.Arrays;
import java.util.Map;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.aspectj.lang.reflect.MethodSignature;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.infrastructure.shared.TraceContext;

import jakarta.servlet.http.HttpServletRequest;

/**
 * Aspect for comprehensive REST controller logging.
 * Automatically logs all REST API method calls with:
 * - TraceId for request correlation
 * - Method invocation with parameters
 * - Execution timing
 * - Response status
 * - Error details
 */
@Aspect
@Component
public class RestLoggingAspect {

  private static final Logger logger = LoggerFactory.getLogger(RestLoggingAspect.class);
  private static final int MAX_PARAM_LENGTH = 200;

  /**
   * Pointcut for all REST controller methods
   */
  @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
  public void restControllerMethods() {
  }

  /**
   * Pointcut for all public methods in controllers
   */
  @Pointcut("execution(public * *(..))")
  public void publicMethods() {
  }

  /**
   * Log all REST controller method executions
   */
  @Around("restControllerMethods() && publicMethods()")
  public Object logRestMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    String traceId = TraceContext.getTraceId();
    String className = joinPoint.getTarget().getClass().getSimpleName();
    String methodName = joinPoint.getSignature().getName();
    long startTime = System.currentTimeMillis();

    // Get method parameters for logging
    String params = extractParameters(joinPoint);

    // Log method entry
    logger.info("[REST][traceId={}] → {}.{} | params={}",
        traceId, className, methodName, params);

    try {
      Object result = joinPoint.proceed();
      long duration = System.currentTimeMillis() - startTime;

      // Log successful response
      logSuccessResponse(traceId, className, methodName, result, duration);

      return result;
    } catch (Exception e) {
      long duration = System.currentTimeMillis() - startTime;

      // Log error
      logger.error("[REST][traceId={}] ✗ {}.{} | duration={}ms | error={}: {}",
          traceId, className, methodName, duration,
          e.getClass().getSimpleName(), e.getMessage());

      throw e;
    }
  }

  /**
   * Extract method parameters for logging
   */
  private String extractParameters(ProceedingJoinPoint joinPoint) {
    try {
      MethodSignature signature = (MethodSignature) joinPoint.getSignature();
      String[] paramNames = signature.getParameterNames();
      Object[] paramValues = joinPoint.getArgs();
      java.lang.annotation.Annotation[][] paramAnnotations = signature.getMethod().getParameterAnnotations();

      if (paramNames == null || paramNames.length == 0) {
        return "{}";
      }

      StringBuilder sb = new StringBuilder("{");
      boolean first = true;

      for (int i = 0; i < paramNames.length; i++) {
        Object value = paramValues[i];
        String paramName = paramNames[i];

        // Skip HttpServletRequest and HttpServletResponse
        if (value instanceof HttpServletRequest ||
            value instanceof jakarta.servlet.http.HttpServletResponse) {
          continue;
        }

        // Check if parameter has @PathVariable or @RequestParam annotation
        boolean isPathOrQueryParam = hasAnnotation(paramAnnotations[i], PathVariable.class) ||
            hasAnnotation(paramAnnotations[i], RequestParam.class);

        if (!first) {
          sb.append(", ");
        }
        first = false;

        sb.append(paramName).append("=");
        sb.append(formatParamValue(value, isPathOrQueryParam));
      }

      sb.append("}");
      return sb.toString();
    } catch (Exception e) {
      return "{error extracting params}";
    }
  }

  /**
   * Check if parameter has a specific annotation
   */
  private boolean hasAnnotation(java.lang.annotation.Annotation[] annotations, Class<?> annotationClass) {
    for (java.lang.annotation.Annotation annotation : annotations) {
      if (annotationClass.isInstance(annotation)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Format parameter value for logging
   */
  private String formatParamValue(Object value, boolean isPathOrQueryParam) {
    if (value == null) {
      return "null";
    }

    // Always log path and query params
    if (isPathOrQueryParam) {
      return truncate(String.valueOf(value));
    }

    // Handle MultipartFile
    if (value instanceof MultipartFile file) {
      return String.format("MultipartFile[name=%s, size=%d]",
          file.getOriginalFilename(), file.getSize());
    }

    // Handle Maps (request bodies) - log keys only for security
    if (value instanceof Map<?, ?> map) {
      return "Map[keys=" + map.keySet() + "]";
    }

    // Handle arrays
    if (value.getClass().isArray()) {
      return "Array[length=" + java.lang.reflect.Array.getLength(value) + "]";
    }

    // Handle lists
    if (value instanceof java.util.List<?> list) {
      return "List[size=" + list.size() + "]";
    }

    // Default - truncate for security
    String str = value.toString();
    if (str.length() > MAX_PARAM_LENGTH) {
      return truncate(str);
    }

    return str;
  }

  /**
   * Truncate string for logging
   */
  private String truncate(String value) {
    if (value == null) {
      return "null";
    }
    if (value.length() <= MAX_PARAM_LENGTH) {
      return value;
    }
    return value.substring(0, MAX_PARAM_LENGTH) + "...[truncated]";
  }

  /**
   * Log successful response
   */
  private void logSuccessResponse(String traceId, String className, String methodName,
      Object result, long duration) {
    String resultInfo = formatResult(result);

    if (duration > 5000) {
      // Slow request warning (> 5 seconds)
      logger.warn("[REST][traceId={}][SLOW] ✓ {}.{} | duration={}ms | result={}",
          traceId, className, methodName, duration, resultInfo);
    } else if (duration > 1000) {
      // Moderate request (> 1 second)
      logger.info("[REST][traceId={}] ✓ {}.{} | duration={}ms | result={}",
          traceId, className, methodName, duration, resultInfo);
    } else {
      // Fast request
      logger.debug("[REST][traceId={}] ✓ {}.{} | duration={}ms | result={}",
          traceId, className, methodName, duration, resultInfo);
    }
  }

  /**
   * Format result for logging
   */
  private String formatResult(Object result) {
    if (result == null) {
      return "null";
    }

    if (result instanceof ResponseEntity<?> response) {
      return String.format("ResponseEntity[status=%s, hasBody=%s]",
          response.getStatusCode(), response.hasBody());
    }

    if (result instanceof java.util.List<?> list) {
      return "List[size=" + list.size() + "]";
    }

    if (result instanceof Map<?, ?> map) {
      return "Map[size=" + map.size() + "]";
    }

    if (result instanceof java.util.Optional<?> opt) {
      return "Optional[present=" + opt.isPresent() + "]";
    }

    return result.getClass().getSimpleName();
  }
}
