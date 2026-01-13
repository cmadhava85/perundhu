package com.perundhu.infrastructure;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import static org.junit.jupiter.api.Assertions.*;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Test virtual thread functionality
 */
public class VirtualThreadTest {

  private static final Logger log = LoggerFactory
      .getLogger(VirtualThreadTest.class);

  @Test
  @DisplayName("Virtual threads are supported")
  public void testVirtualThreadsSupported() {
    assertDoesNotThrow(() -> {
      Thread vt = Thread.ofVirtual()
          .name("test-vt")
          .start(() -> log.info("Virtual thread executed"));
    });
  }

  @Test
  @DisplayName("Many virtual threads can be created")
  public void testManyVirtualThreads() {
    long startTime = System.currentTimeMillis();

    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {

      // Create 1000 virtual threads
      var futures = new java.util.ArrayList<CompletableFuture<Void>>();

      for (int i = 0; i < 1000; i++) {
        futures.add(CompletableFuture.runAsync(
            () -> {
              try {
                Thread.sleep(100); // Simulate I/O
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              }
            },
            executor));
      }

      // Wait for all
      CompletableFuture.allOf(
          futures.toArray(new CompletableFuture[0])).join();

      long duration = System.currentTimeMillis() - startTime;
      log.info("1000 virtual threads completed in {}ms", duration);

      // Should complete in roughly 100ms (not 100 seconds)
      assertTrue(duration < 200,
          "1000 virtual threads took too long: " + duration + "ms");

    }
  }

  @Test
  @DisplayName("Virtual threads reduce memory overhead")
  public void testVirtualThreadMemoryEfficiency() {
    Runtime runtime = Runtime.getRuntime();
    long beforeMemory = runtime.totalMemory() - runtime.freeMemory();

    try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {

      // Create 100 virtual threads
      var futures = new java.util.ArrayList<CompletableFuture<Void>>();
      for (int i = 0; i < 100; i++) {
        futures.add(CompletableFuture.runAsync(
            () -> {
              try {
                Thread.sleep(50);
              } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
              }
            },
            executor));
      }

      CompletableFuture.allOf(
          futures.toArray(new CompletableFuture[0])).join();
    }

    long afterMemory = runtime.totalMemory() - runtime.freeMemory();
    long memoryUsed = afterMemory - beforeMemory;

    log.info("Memory used for 100 virtual threads: {}MB",
        memoryUsed / (1024 * 1024));

    // Should use less than 50MB for 100 virtual threads
    assertTrue(memoryUsed < 50 * 1024 * 1024,
        "Virtual threads used too much memory: " +
            (memoryUsed / (1024 * 1024)) + "MB");
  }
}
