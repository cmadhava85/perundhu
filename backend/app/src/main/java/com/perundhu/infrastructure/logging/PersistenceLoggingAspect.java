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
 * Aspect for comprehensive persistence layer logging.
 * Automatically logs all repository/adapter method calls with:
 * - TraceId for request correlation
 * - Query timing for performance monitoring
 * - Error details
 */
@Aspect
@Component
public class PersistenceLoggingAspect {

  private static final Logger logger = LoggerFactory.getLogger(PersistenceLoggingAspect.class);

  // Slow query threshold in milliseconds
  private static final long SLOW_QUERY_THRESHOLD = 500;
  private static final long VERY_SLOW_QUERY_THRESHOLD = 2000;

  /**
   * Pointcut for all classes in adapter.out package (persistence adapters)
   */
  @Pointcut("within(com.perundhu.adapter.out..*)")
  public void persistenceAdapterMethods() {
  }

  /**
   * Pointcut for repository methods
   */
  @Pointcut("execution(* com.perundhu.domain.port..*Repository.*(..))")
  public void repositoryMethods() {
  }

  /**
   * Pointcut for all public methods
   */
  @Pointcut("execution(public * *(..))")
  public void publicMethods() {
  }

  /**
   * Log all persistence layer method executions
   */
  @Around("(persistenceAdapterMethods() || repositoryMethods()) && publicMethods()")
  public Object logPersistenceMethod(ProceedingJoinPoint joinPoint) throws Throwable {
    String traceId = TraceContext.getTraceId();
    String className = joinPoint.getTarget().getClass().getSimpleName();
    String methodName = joinPoint.getSignature().getName();
    long startTime = System.currentTimeMillis();

    try {
      Object result = joinPoint.proceed();
      long duration = System.currentTimeMillis() - startTime;

      // Log based on duration
      if (duration > VERY_SLOW_QUERY_THRESHOLD) {
        // Very slow query - error level
        logger.error("[PERSISTENCE][traceId={}][VERY_SLOW] {}.{} | duration={}ms",
            traceId, className, methodName, duration);
      } else if (duration > SLOW_QUERY_THRESHOLD) {
        // Slow query - warning level
        logger.warn("[PERSISTENCE][traceId={}][SLOW] {}.{} | duration={}ms",
            traceId, className, methodName, duration);
      } else if (logger.isDebugEnabled()) {
        // Normal query - debug level
        logger.debug("[PERSISTENCE][traceId={}] {}.{} | duration={}ms",
            traceId, className, methodName, duration);
      }

      return result;
    } catch (Exception e) {
      long duration = System.currentTimeMillis() - startTime;

      // Log error with full context
      logger.error("[PERSISTENCE][traceId={}] ✗ {}.{} | duration={}ms | error={}: {}",
          traceId, className, methodName, duration,
          e.getClass().getSimpleName(), e.getMessage());

      throw e;
    }
  }
}
