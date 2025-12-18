package com.perundhu.infrastructure.config;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.web.embedded.tomcat.TomcatProtocolHandlerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.task.AsyncTaskExecutor;
import org.springframework.core.task.support.TaskExecutorAdapter;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Configuration to enable Java 21 Virtual Threads for improved scalability.
 * 
 * Virtual Threads (Project Loom) provide:
 * - Lightweight threads that can scale to millions
 * - Non-blocking I/O with simple blocking code style
 * - Better resource utilization for I/O-bound operations
 * - No need to switch to reactive programming (WebFlux) for scalability
 * 
 * This configuration:
 * 1. Configures Tomcat to use virtual threads for request handling
 * 2. Provides a virtual thread executor for @Async operations
 * 3. Enables parallel processing of independent database operations
 */
@Configuration
@EnableAsync
@ConditionalOnProperty(name = "spring.threads.virtual.enabled", havingValue = "true", matchIfMissing = true)
public class VirtualThreadConfig {

  private static final Logger log = LoggerFactory.getLogger(VirtualThreadConfig.class);

  /**
   * Configure Tomcat to use virtual threads for handling HTTP requests.
   * Each request gets its own virtual thread, enabling massive concurrency
   * without the overhead of platform threads.
   */
  @Bean
  public TomcatProtocolHandlerCustomizer<?> protocolHandlerVirtualThreadExecutorCustomizer() {
    log.info("Configuring Tomcat to use Java 21 Virtual Threads for HTTP request handling");
    return protocolHandler -> {
      protocolHandler.setExecutor(Executors.newVirtualThreadPerTaskExecutor());
    };
  }

  /**
   * Virtual thread executor for @Async annotated methods.
   * This executor creates a new virtual thread for each task,
   * allowing for efficient parallel execution of I/O-bound operations.
   */
  @Bean(name = "virtualThreadExecutor")
  public AsyncTaskExecutor virtualThreadExecutor() {
    log.info("Creating Virtual Thread Executor for @Async operations");
    return new TaskExecutorAdapter(Executors.newVirtualThreadPerTaskExecutor());
  }

  /**
   * Standard ExecutorService using virtual threads.
   * Can be used directly with CompletableFuture.supplyAsync()
   */
  @Bean(name = "virtualExecutorService")
  public ExecutorService virtualExecutorService() {
    return Executors.newVirtualThreadPerTaskExecutor();
  }

  /**
   * Thread factory that creates virtual threads with a custom name prefix.
   * Useful for debugging and monitoring.
   */
  @Bean(name = "namedVirtualThreadExecutor")
  public ExecutorService namedVirtualThreadExecutor() {
    return Executors.newThreadPerTaskExecutor(
        Thread.ofVirtual()
            .name("perundhu-vt-", 0)
            .factory());
  }
}
