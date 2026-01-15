package com.perundhu.infrastructure.config;

import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * AOP aspect that intercepts @Transactional methods and routes to appropriate datasource.
 * 
 * Routing logic:
 * - @Transactional(readOnly = true)  → Routes to REPLICA datasource
 * - @Transactional(readOnly = false) → Routes to PRIMARY datasource
 * - No @Transactional annotation    → Routes to PRIMARY datasource
 * 
 * This enables automatic read/write splitting for 100k user scale optimization.
 * Estimated traffic split: 80% reads (replica) / 20% writes (primary)
 */
@Aspect
@Component
@Order(0) // Execute before transaction advice
@Slf4j
public class TransactionRoutingAspect {

    /**
     * Intercept all @Transactional annotated methods
     */
    @Around("@annotation(transactional)")
    public Object routeDataSource(ProceedingJoinPoint joinPoint, Transactional transactional) throws Throwable {
        try {
            // Determine datasource based on readOnly flag
            if (transactional.readOnly()) {
                log.trace("Routing read-only transaction to REPLICA: {}.{}",
                        joinPoint.getSignature().getDeclaringTypeName(),
                        joinPoint.getSignature().getName());
                DataSourceContextHolder.setDataSourceType(DataSourceType.REPLICA);
            } else {
                log.trace("Routing read-write transaction to PRIMARY: {}.{}",
                        joinPoint.getSignature().getDeclaringTypeName(),
                        joinPoint.getSignature().getName());
                DataSourceContextHolder.setDataSourceType(DataSourceType.PRIMARY);
            }

            // Execute the method
            return joinPoint.proceed();
            
        } finally {
            // Always clear context after method execution
            DataSourceContextHolder.clearDataSourceType();
        }
    }
}
