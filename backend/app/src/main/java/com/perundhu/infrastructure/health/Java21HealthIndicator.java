package com.perundhu.infrastructure.health;

import org.springframework.boot.actuate.health.Health;
import org.springframework.boot.actuate.health.HealthIndicator;
import org.springframework.stereotype.Component;
import java.lang.management.ManagementFactory;
import java.lang.management.ThreadMXBean;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Health indicator for Java 21 Virtual Threads
 * 
 * Checks:
 * - Virtual threads are enabled
 * - JVM is running on Java 21+
 * - Thread counts are reasonable
 * - Memory usage is acceptable
 */
@Component
public class Java21HealthIndicator implements HealthIndicator {

  private static final Logger log = LoggerFactory
      .getLogger(Java21HealthIndicator.class);

  @Override
  public Health health() {
    try {
      // Get current Java version
      String javaVersion = System.getProperty("java.version");
      int majorVersion = Integer.parseInt(javaVersion.split("\\.")[0]);

      // Verify Java 21+
      if (majorVersion < 21) {
        log.error("Java 21 or higher required, but found: {}", javaVersion);
        return Health.down()
            .withDetail("issue", "Java 21 or higher required")
            .withDetail("java.version", javaVersion)
            .build();
      }

      // Check virtual threads support
      boolean virtualThreadsSupported = isVirtualThreadsSupported();
      if (!virtualThreadsSupported) {
        log.warn("Virtual threads not supported on this JVM");
        return Health.down()
            .withDetail("issue", "Virtual threads not supported")
            .withDetail("java.version", javaVersion)
            .build();
      }

      // Get thread metrics
      ThreadMXBean threadBean = ManagementFactory.getThreadMXBean();
      long currentThreadCount = threadBean.getThreadCount();
      long peakThreadCount = threadBean.getPeakThreadCount();

      // Get memory metrics
      Runtime runtime = Runtime.getRuntime();
      long maxMemory = runtime.maxMemory();
      long freeMemory = runtime.freeMemory();
      long usedMemory = runtime.totalMemory() - freeMemory;
      double memoryUsagePercent = (usedMemory * 100.0) / maxMemory;

      // Check if memory usage is acceptable (< 80%)
      String memoryStatus = memoryUsagePercent < 80 ? "OK" : "HIGH";

      log.info(
          "Health check: Java {}, Threads: {}/{}, Memory: {}/{}MB ({:.1f}%)",
          javaVersion,
          currentThreadCount,
          peakThreadCount,
          usedMemory / (1024 * 1024),
          maxMemory / (1024 * 1024),
          memoryUsagePercent);

      return Health.up()
          .withDetail("java.version", javaVersion)
          .withDetail("java.major.version", majorVersion)
          .withDetail("virtualThreadsSupported", true)
          .withDetail("virtualThreadsEnabled", isVirtualThreadsEnabled())
          .withDetail("currentThreadCount", currentThreadCount)
          .withDetail("peakThreadCount", peakThreadCount)
          .withDetail("maxMemory.mb", maxMemory / (1024 * 1024))
          .withDetail("usedMemory.mb", usedMemory / (1024 * 1024))
          .withDetail("freeMemory.mb", freeMemory / (1024 * 1024))
          .withDetail("memoryUsagePercent", String.format("%.1f%%", memoryUsagePercent))
          .withDetail("memoryStatus", memoryStatus)
          .build();

    } catch (Exception e) {
      log.error("Error checking Java 21 health", e);
      return Health.down()
          .withException(e)
          .build();
    }
  }

  /**
   * Check if virtual threads are supported
   * by attempting to create one
   */
  private boolean isVirtualThreadsSupported() {
    try {
      Thread virtualThread = Thread.ofVirtual()
          .name("health-check-vt")
          .start(() -> {
            // Do nothing
          });
      virtualThread.join();
      return true;
    } catch (Exception e) {
      log.warn("Virtual threads not supported: {}", e.getMessage());
      return false;
    }
  }

  /**
   * Check if virtual threads are explicitly enabled
   */
  private boolean isVirtualThreadsEnabled() {
    String property = System.getProperty(
        "spring.threads.virtual.enabled");
    return "true".equalsIgnoreCase(property);
  }
}
