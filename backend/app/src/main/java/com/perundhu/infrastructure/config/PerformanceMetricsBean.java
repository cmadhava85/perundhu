package com.perundhu.infrastructure.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

/**
 * Performance metrics bean for Java 21 monitoring
 */
@Component
public class PerformanceMetricsBean {

  private static final Logger log = LoggerFactory
      .getLogger(PerformanceMetricsBean.class);

  private final Timer routeGraphBuildTime;
  private final Timer locationResolutionTime;
  private final Timer virtualThreadExecutionTime;

  public PerformanceMetricsBean(MeterRegistry meterRegistry) {

    log.info("Initializing performance metrics");

    // Route graph building metrics
    this.routeGraphBuildTime = Timer.builder("route.graph.build.time")
        .description("Time to build route graph")
        .publishPercentiles(0.5, 0.95, 0.99)
        .publishPercentileHistogram()
        .tags("service", "routing")
        .register(meterRegistry);

    // Location resolution metrics
    this.locationResolutionTime = Timer.builder("location.resolution.time")
        .description("Time to resolve location")
        .publishPercentiles(0.5, 0.95, 0.99)
        .publishPercentileHistogram()
        .tags("service", "location")
        .register(meterRegistry);

    // Virtual thread execution metrics
    this.virtualThreadExecutionTime = Timer.builder("virtual.thread.execution.time")
        .description("Execution time with virtual threads")
        .publishPercentiles(0.5, 0.95, 0.99)
        .publishPercentileHistogram()
        .tags("service", "concurrency")
        .register(meterRegistry);

    log.info("Performance metrics initialized");
  }

  public Timer getRouteGraphBuildTime() {
    return routeGraphBuildTime;
  }

  public Timer getLocationResolutionTime() {
    return locationResolutionTime;
  }

  public Timer getVirtualThreadExecutionTime() {
    return virtualThreadExecutionTime;
  }
}
