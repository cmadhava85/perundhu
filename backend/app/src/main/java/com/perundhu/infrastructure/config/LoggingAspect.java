package com.perundhu.infrastructure.config;

import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.concurrent.atomic.AtomicLong;

import org.aspectj.lang.JoinPoint;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.AfterThrowing;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Pointcut;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import com.perundhu.infrastructure.shared.LoggerUtil;

/**
 * Aspect for logging execution of controller, service, and repository Spring components.
 * Enhanced with performance metrics, MDC context, and structured logging.
 */
@Aspect
@Component
public class LoggingAspect {

    private final LoggerUtil logger = LoggerUtil.getLogger(this.getClass());
    
    // Metrics tracking
    private final ConcurrentHashMap<String, MethodMetrics> methodMetrics = new ConcurrentHashMap<>();
    
    // MDC keys for distributed tracing
    private static final String REQUEST_ID = "requestId";
    private static final String METHOD_NAME = "methodName";
    
    // Performance thresholds (milliseconds)
    private static final long SLOW_METHOD_THRESHOLD = 1000; // 1 second
    private static final long VERY_SLOW_METHOD_THRESHOLD = 5000; // 5 seconds

    /**
     * Pointcut for controllers.
     */
    @Pointcut("within(@org.springframework.web.bind.annotation.RestController *)")
    public void controllerPointcut() {
        // Method is empty as this is just a Pointcut
    }

    /**
     * Pointcut for services.
     */
    @Pointcut("within(@org.springframework.stereotype.Service *)")
    public void servicePointcut() {
        // Method is empty as this is just a Pointcut
    }

    /**
     * Pointcut for repositories.
     */
    @Pointcut("within(@org.springframework.stereotype.Repository *)")
    public void repositoryPointcut() {
        // Method is empty as this is just a Pointcut
    }

    /**
     * Advice that logs methods throwing exceptions.
     *
     * @param joinPoint join point for advice
     * @param e exception thrown
     */
    @AfterThrowing(pointcut = "controllerPointcut() || servicePointcut() || repositoryPointcut()", throwing = "e")
    public void logAfterThrowing(JoinPoint joinPoint, Throwable e) {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        // Track error metrics
        updateErrorMetrics(fullMethodName);
        
        logger.error("Exception in {}.{}() with cause = '{}', message = '{}'",
                className,
                methodName,
                e.getCause() != null ? e.getCause().getClass().getSimpleName() : "NULL",
                e.getMessage());
        
        // Log stack trace for debugging in debug mode
        if (logger.isDebug()) {
            logger.debug("Stack trace for {}.{}(): ", className, methodName, e);
        }
    }

    /**
     * Advice that logs when a method is entered and exited with performance timing.
     *
     * @param joinPoint join point for advice
     * @return result
     * @throws Throwable throws IllegalArgumentException
     */
    @Around("controllerPointcut() || servicePointcut() || repositoryPointcut()")
    public Object logAround(ProceedingJoinPoint joinPoint) throws Throwable {
        String className = joinPoint.getSignature().getDeclaringTypeName();
        String methodName = joinPoint.getSignature().getName();
        String fullMethodName = className + "." + methodName;
        
        // Set up MDC context for this request
        String requestId = MDC.get(REQUEST_ID);
        if (requestId == null) {
            requestId = UUID.randomUUID().toString().substring(0, 8);
            MDC.put(REQUEST_ID, requestId);
        }
        MDC.put(METHOD_NAME, fullMethodName);
        
        long startTime = System.currentTimeMillis();
        
        if (logger.isDebug()) {
            logger.debug("Enter: {}.{}() with argument[s] = {}",
                    className,
                    methodName,
                    sanitizeArgs(joinPoint.getArgs()));
        }
        
        try {
            Object result = joinPoint.proceed();
            long executionTime = System.currentTimeMillis() - startTime;
            
            // Update metrics
            updateSuccessMetrics(fullMethodName, executionTime);
            
            // Log with performance info
            if (executionTime >= VERY_SLOW_METHOD_THRESHOLD) {
                logger.warn("VERY SLOW: {}.{}() took {}ms (threshold: {}ms)",
                        className, methodName, executionTime, VERY_SLOW_METHOD_THRESHOLD);
            } else if (executionTime >= SLOW_METHOD_THRESHOLD) {
                logger.warn("SLOW: {}.{}() took {}ms (threshold: {}ms)",
                        className, methodName, executionTime, SLOW_METHOD_THRESHOLD);
            } else if (logger.isDebug()) {
                logger.debug("Exit: {}.{}() in {}ms with result = {}",
                        className,
                        methodName,
                        executionTime,
                        sanitizeResult(result));
            }
            
            return result;
        } catch (IllegalArgumentException e) {
            long executionTime = System.currentTimeMillis() - startTime;
            updateErrorMetrics(fullMethodName);
            
            logger.error("Illegal argument in {}.{}() after {}ms: {}",
                    className,
                    methodName,
                    executionTime,
                    Arrays.toString(joinPoint.getArgs()));
            throw e;
        } finally {
            MDC.remove(METHOD_NAME);
        }
    }
    
    /**
     * Sanitize arguments to avoid logging sensitive data
     */
    private String sanitizeArgs(Object[] args) {
        if (args == null || args.length == 0) {
            return "[]";
        }
        
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < args.length; i++) {
            if (i > 0) sb.append(", ");
            
            Object arg = args[i];
            if (arg == null) {
                sb.append("null");
            } else if (isSensitiveType(arg)) {
                sb.append("<REDACTED>");
            } else {
                String argStr = arg.toString();
                // Truncate long arguments
                if (argStr.length() > 500) {
                    sb.append(argStr.substring(0, 500)).append("...(truncated)");
                } else {
                    sb.append(argStr);
                }
            }
        }
        sb.append("]");
        return sb.toString();
    }
    
    /**
     * Sanitize result to avoid logging sensitive or overly long data
     */
    private String sanitizeResult(Object result) {
        if (result == null) {
            return "null";
        }
        
        String resultStr = result.toString();
        if (resultStr.length() > 1000) {
            return resultStr.substring(0, 1000) + "...(truncated)";
        }
        return resultStr;
    }
    
    /**
     * Check if argument type contains sensitive data
     */
    private boolean isSensitiveType(Object arg) {
        String className = arg.getClass().getName().toLowerCase();
        return className.contains("password") ||
               className.contains("credential") ||
               className.contains("secret") ||
               className.contains("token") ||
               className.contains("apikey");
    }
    
    /**
     * Update success metrics for a method
     */
    private void updateSuccessMetrics(String methodName, long executionTime) {
        methodMetrics.compute(methodName, (key, metrics) -> {
            if (metrics == null) {
                metrics = new MethodMetrics();
            }
            metrics.recordSuccess(executionTime);
            return metrics;
        });
    }
    
    /**
     * Update error metrics for a method
     */
    private void updateErrorMetrics(String methodName) {
        methodMetrics.compute(methodName, (key, metrics) -> {
            if (metrics == null) {
                metrics = new MethodMetrics();
            }
            metrics.recordError();
            return metrics;
        });
    }
    
    /**
     * Get metrics for monitoring dashboard
     */
    public Map<String, MethodMetrics> getMethodMetrics() {
        return methodMetrics;
    }
    
    /**
     * Inner class to track method metrics
     */
    public static class MethodMetrics {
        private final AtomicLong totalCalls = new AtomicLong(0);
        private final AtomicLong successCalls = new AtomicLong(0);
        private final AtomicLong errorCalls = new AtomicLong(0);
        private final AtomicLong totalExecutionTime = new AtomicLong(0);
        private volatile long maxExecutionTime = 0;
        private volatile long minExecutionTime = Long.MAX_VALUE;
        
        public void recordSuccess(long executionTime) {
            totalCalls.incrementAndGet();
            successCalls.incrementAndGet();
            totalExecutionTime.addAndGet(executionTime);
            
            // Update max/min (not perfectly thread-safe but acceptable for metrics)
            if (executionTime > maxExecutionTime) {
                maxExecutionTime = executionTime;
            }
            if (executionTime < minExecutionTime) {
                minExecutionTime = executionTime;
            }
        }
        
        public void recordError() {
            totalCalls.incrementAndGet();
            errorCalls.incrementAndGet();
        }
        
        public long getTotalCalls() { return totalCalls.get(); }
        public long getSuccessCalls() { return successCalls.get(); }
        public long getErrorCalls() { return errorCalls.get(); }
        public double getAverageExecutionTime() {
            long calls = successCalls.get();
            return calls > 0 ? (double) totalExecutionTime.get() / calls : 0;
        }
        public long getMaxExecutionTime() { return maxExecutionTime; }
        public long getMinExecutionTime() { return minExecutionTime == Long.MAX_VALUE ? 0 : minExecutionTime; }
        public double getErrorRate() {
            long total = totalCalls.get();
            return total > 0 ? (double) errorCalls.get() / total * 100 : 0;
        }
    }
}