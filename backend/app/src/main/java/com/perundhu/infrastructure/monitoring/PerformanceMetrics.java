package com.perundhu.infrastructure.monitoring;

import java.util.concurrent.TimeUnit;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.Timer;

/**
 * Performance metrics tracking for API latency, cache hits, and database
 * queries
 * PHASE 2 OPTIMIZATION: Add monitoring to identify bottlenecks
 */
@Component
public class PerformanceMetrics {

  private final MeterRegistry meterRegistry;

  @Autowired
  public PerformanceMetrics(MeterRegistry meterRegistry) {
    this.meterRegistry = meterRegistry;
  }

  /**
   * Record API endpoint latency
   * 
   * @param endpoint   Endpoint path (e.g., /api/v1/bus-schedules/search)
   * @param durationMs Duration in milliseconds
   */
  public void recordApiLatency(String endpoint, long durationMs) {
    Timer.builder("api.latency")
        .tag("endpoint", endpoint)
        .description("API endpoint response time")
        .register(meterRegistry)
        .record(durationMs, TimeUnit.MILLISECONDS);
  }

  /**
   * Record cache hit or miss
   * 
   * @param cacheName Name of the cache (e.g., busSearchCache, locationsCache)
   * @param hit       True if cache hit, false if cache miss
   */
  public void recordCacheHit(String cacheName, boolean hit) {
    Counter.builder("cache.hits")
        .tag("cache", cacheName)
        .tag("result", hit ? "hit" : "miss")
        .description("Cache hit/miss rate")
        .register(meterRegistry)
        .increment();
  }

  /**
   * Record database query execution time
   * 
   * @param queryType  Type of query (e.g., busSearch, locationLookup)
   * @param durationMs Duration in milliseconds
   */
  public void recordDatabaseQueryTime(String queryType, long durationMs) {
    Timer.builder("database.query.time")
        .tag("type", queryType)
        .description("Database query execution time")
        .register(meterRegistry)
        .record(durationMs, TimeUnit.MILLISECONDS);
  }

  /**
   * Record external API call latency (e.g., Gemini Vision, OSM Nominatim)
   * 
   * @param apiName    Name of external API
   * @param durationMs Duration in milliseconds
   * @param success    True if call succeeded, false if failed
   */
  public void recordExternalApiCall(String apiName, long durationMs, boolean success) {
    Timer.builder("external.api.latency")
        .tag("api", apiName)
        .tag("status", success ? "success" : "failure")
        .description("External API call latency")
        .register(meterRegistry)
        .record(durationMs, TimeUnit.MILLISECONDS);
  }

  /**
   * Record custom business metric
   * 
   * @param metricName Name of the metric
   * @param value      Numeric value to record
   */
  public void recordCustomMetric(String metricName, double value) {
    Counter.builder(metricName)
        .description("Custom business metric")
        .register(meterRegistry)
        .increment(value);
  }
}
