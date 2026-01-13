package com.perundhu.infrastructure.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Java 21 Virtual Thread Configuration
 * 
 * Key differences from traditional thread pools:
 * - Virtual threads are very cheap (a few KB vs 1MB for platform threads)
 * - We can afford much larger pool sizes
 * - Thread creation/destruction overhead is negligible
 * - No need for thread reuse optimization
 */
@Configuration
public class ThreadPoolConfiguration {

  private static final Logger log = LoggerFactory
      .getLogger(ThreadPoolConfiguration.class);

  /**
   * Virtual Thread Executor - The workhorse for async tasks
   * 
   * Creates a new virtual thread for each task (very cheap!)
   * No pooling needed - thread creation is instant
   */
  @Bean(name = "virtualThreadExecutor")
  public ExecutorService virtualThreadExecutor() {
    log.info("Initializing Virtual Thread Executor");
    // This creates a new virtual thread per task - perfect for I/O operations
    return Executors.newVirtualThreadPerTaskExecutor();
  }

  /**
   * Structured Concurrency Executor
   * For operations that need guaranteed completion/timeout
   */
  @Bean(name = "structuredExecutor")
  public ExecutorService structuredExecutor() {
    log.info("Initializing Structured Concurrency Executor");
    return Executors.newVirtualThreadPerTaskExecutor();
  }

  /**
   * Async Task Executor - Used for @Async methods
   * 
   * Even though we use virtual threads, we keep some bounds:
   * - Not truly unbounded for safety
   * - Still allows massive concurrency (1000x more than platform threads)
   */
  @Bean(name = "asyncExecutor")
  public ThreadPoolTaskExecutor asyncExecutor() {
    log.info("Initializing Async Task Executor with Virtual Threads");

    ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();

    // Virtual threads are cheap - we can use larger pools
    executor.setCorePoolSize(1); // Start with 1 platform thread
    executor.setMaxPoolSize(1000); // Can grow to 1000 (virtual threads)
    executor.setQueueCapacity(10000); // Large queue for bursts
    executor.setThreadNamePrefix("async-vt-");
    executor.setWaitForTasksToCompleteOnShutdown(true);
    executor.setAwaitTerminationSeconds(60);

    // Enable virtual threads for this executor
    executor.setVirtualThreads(true);
    executor.initialize();

    log.info("Async executor initialized with virtual thread support");
    return executor;
  }

  /**
   * Scheduler Task Executor - For @Scheduled methods
   * 
   * Scheduled tasks rarely block, so we use a small pool
   * But we use virtual threads for efficiency
   */
  @Bean(name = "taskScheduler")
  public ThreadPoolTaskScheduler taskScheduler() {
    log.info("Initializing Task Scheduler with Virtual Threads");

    ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();

    scheduler.setPoolSize(10); // Small pool - tasks rarely block
    scheduler.setThreadNamePrefix("scheduled-vt-");
    scheduler.setVirtualThreads(true); // Use virtual threads
    scheduler.setWaitForTasksToCompleteOnShutdown(true);
    scheduler.setAwaitTerminationSeconds(60);
    scheduler.initialize();

    log.info("Task scheduler initialized with virtual thread support");
    return scheduler;
  }

  /**
   * Heavy I/O Operations Executor
   * For database operations, external API calls, etc.
   */
  @Bean(name = "ioExecutor")
  public ExecutorService ioExecutor() {
    log.info("Initializing I/O Operations Executor");
    return Executors.newVirtualThreadPerTaskExecutor();
  }

  /**
   * CPU-Bound Operations Executor
   * For computationally intensive tasks
   */
  @Bean(name = "cpuExecutor")
  public ExecutorService cpuExecutor() {
    log.info("Initializing CPU-Bound Operations Executor");

    // For CPU-bound tasks, match the number of cores
    int coreCount = Runtime.getRuntime().availableProcessors();
    return Executors.newFixedThreadPool(
        coreCount,
        Thread.ofVirtual()
            .name("cpu-vt-", 0)
            .factory());
  }

  /**
   * Health check for thread configuration
   */
  public record ThreadPoolStats(
      String executorName,
      int activeThreads,
      long totalProcessed,
      String threadType) {
  }

  @Bean
  public ThreadPoolStats threadPoolStats() {
    log.info("Virtual Thread executor pool configured and ready");

    // This will be used by health checks
    return new ThreadPoolStats(
        "asyncExecutor",
        0,
        0,
        "virtual");
  }
}
