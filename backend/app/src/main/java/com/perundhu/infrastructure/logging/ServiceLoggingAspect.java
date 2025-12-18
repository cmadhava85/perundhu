package com.perundhu.infrastructure.logging;

import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import com.perundhu.infrastructure.shared.TraceContext;

/**
 * Aspect for comprehensive service layer logging.
 * Automatically logs all application service method calls with:
 * - TraceId for request correlation
 * - Method invocation timing
 * - Error details with stack trace
 */
@Aspect
@Component
public class ServiceLoggingAspect {

  private static final Logger logger = LoggerFactory.getLogger(ServiceLoggingAspect.class);

  /**
   * Pointcut for all classes in application.service package
   */
  @Pointcut("within(com.perundhu.application.service..*)")
  public void applicationServiceMethods() {
  }

  /**
   * Pointcut for all public methods
   */
  @Pointcut("execution(public * *(..))")
  public void publicMethods() {
  }

  /**
   * Log all application service method executions
   */
  @Around("applicationServiceMethods() && publicMethods()")
  public Object logServiceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    String traceId = TraceContext.getTraceId();
    String className = joinPoint.getTarget().getClass().getSimpleName();
    String methodName = joinPoint.getSignature().getName();
    long startTime = System.currentTimeMillis();

    // Determine log level based on method type
    boolean isQueryMethod = isQueryMethod(methodName);

    if (!isQueryMethod) {
      // Log method entry for non-query methods (commands)
      logger.debug("[SERVICE][traceId={}] → {}.{}", traceId, className, methodName);
    }

    try {
      Object result = joinPoint.proceed();
      long duration = System.currentTimeMillis() - startTime;

      // Log based on duration and method type
      if (duration > 3000) {
        // Slow service call warning (> 3 seconds)
        logger.warn("[SERVICE][traceId={}][SLOW] ✓ {}.{} | duration={}ms",
            traceId, className, methodName, duration);
      } else if (!isQueryMethod && duration > 100) {
        // Log non-trivial operations
        logger.debug("[SERVICE][traceId={}] ✓ {}.{} | duration={}ms",
            traceId, className, methodName, duration);
      }

      return result;
    } catch (Exception e) {
      long duration = System.currentTimeMillis() - startTime;

      // Log error with full context
      logger.error("[SERVICE][traceId={}] ✗ {}.{} | duration={}ms | error={}: {}",
          traceId, className, methodName, duration,
          e.getClass().getSimpleName(), e.getMessage(), e);

      throw e;
    }
  }

  /**
   * Determine if method is a query (read) operation
   */
  private boolean isQueryMethod(String methodName) {
    String lowerName = methodName.toLowerCase();
    return lowerName.startsWith("get") ||
        lowerName.startsWith("find") ||
        lowerName.startsWith("search") ||
        lowerName.startsWith("fetch") ||
        lowerName.startsWith("list") ||
        lowerName.startsWith("is") ||
        lowerName.startsWith("has") ||
        lowerName.startsWith("check") ||
        lowerName.startsWith("count") ||
        lowerName.startsWith("exists");
  }
}
