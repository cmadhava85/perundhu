package com.perundhu.application.service;

import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.function.Supplier;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

/**
 * Service for executing parallel operations using Java 21 Virtual Threads.
 * 
 * This service provides utilities to run multiple independent operations in
 * parallel,
 * taking advantage of virtual threads for efficient I/O-bound operations like:
 * - Multiple database queries
 * - External API calls
 * - File operations
 * 
 * Benefits of virtual threads:
 * - Lightweight: millions of virtual threads can run concurrently
 * - Simple code: write blocking code that runs efficiently
 * - No callback hell: no need for reactive programming complexity
 * - Better debugging: stack traces work normally
 * 
 * Example usage:
 * 
 * <pre>
 * // Execute two independent database queries in parallel
 * var results = parallelExecutor.executeAll(
 *     () -> busRepository.findByLocation(locationId),
 *     () -> stopRepository.findByBus(busId));
 * List<Bus> buses = results.get(0);
 * List<Stop> stops = results.get(1);
 * </pre>
 */
@Service
@ConditionalOnProperty(name = "spring.threads.virtual.enabled", havingValue = "true")
public class ParallelExecutionService {

  private static final Logger log = LoggerFactory.getLogger(ParallelExecutionService.class);

  private final ExecutorService virtualExecutorService;

  public ParallelExecutionService(
      @Qualifier("virtualExecutorService") ExecutorService virtualExecutorService) {
    this.virtualExecutorService = virtualExecutorService;
  }

  /**
   * Execute multiple independent operations in parallel and wait for all to
   * complete.
   * 
   * @param suppliers The operations to execute
   * @return List of results in the same order as suppliers
   */
  @SafeVarargs
  public final <T> List<T> executeAll(Supplier<T>... suppliers) {
    long startTime = System.currentTimeMillis();

    // Create CompletableFutures for all operations
    List<CompletableFuture<T>> futures = java.util.Arrays.stream(suppliers)
        .map(supplier -> CompletableFuture.supplyAsync(supplier, virtualExecutorService))
        .toList();

    // Wait for all to complete and collect results
    List<T> results = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());

    log.debug("Parallel execution of {} operations completed in {}ms",
        suppliers.length, System.currentTimeMillis() - startTime);

    return results;
  }

  /**
   * Execute two independent operations in parallel and return both results.
   * Type-safe alternative to executeAll for two operations.
   */
  public <A, B> Pair<A, B> executePair(Supplier<A> first, Supplier<B> second) {
    long startTime = System.currentTimeMillis();

    CompletableFuture<A> futureA = CompletableFuture.supplyAsync(first, virtualExecutorService);
    CompletableFuture<B> futureB = CompletableFuture.supplyAsync(second, virtualExecutorService);

    // Wait for both
    CompletableFuture.allOf(futureA, futureB).join();

    log.debug("Parallel execution of 2 operations completed in {}ms",
        System.currentTimeMillis() - startTime);

    return new Pair<>(futureA.join(), futureB.join());
  }

  /**
   * Execute three independent operations in parallel and return all results.
   * Type-safe alternative to executeAll for three operations.
   */
  public <A, B, C> Triple<A, B, C> executeTriple(
      Supplier<A> first,
      Supplier<B> second,
      Supplier<C> third) {
    long startTime = System.currentTimeMillis();

    CompletableFuture<A> futureA = CompletableFuture.supplyAsync(first, virtualExecutorService);
    CompletableFuture<B> futureB = CompletableFuture.supplyAsync(second, virtualExecutorService);
    CompletableFuture<C> futureC = CompletableFuture.supplyAsync(third, virtualExecutorService);

    // Wait for all
    CompletableFuture.allOf(futureA, futureB, futureC).join();

    log.debug("Parallel execution of 3 operations completed in {}ms",
        System.currentTimeMillis() - startTime);

    return new Triple<>(futureA.join(), futureB.join(), futureC.join());
  }

  /**
   * Execute an operation asynchronously, returning a CompletableFuture.
   * Use this when you need more control over the async operation.
   */
  public <T> CompletableFuture<T> executeAsync(Supplier<T> supplier) {
    return CompletableFuture.supplyAsync(supplier, virtualExecutorService);
  }

  /**
   * Execute a list of operations in parallel with a maximum concurrency limit.
   * Useful when you have many operations but want to limit concurrent database
   * connections.
   */
  public <T> List<T> executeWithLimit(List<Supplier<T>> suppliers, int maxConcurrent) {
    if (suppliers.isEmpty()) {
      return List.of();
    }

    long startTime = System.currentTimeMillis();

    // Use a semaphore to limit concurrency
    java.util.concurrent.Semaphore semaphore = new java.util.concurrent.Semaphore(maxConcurrent);

    List<CompletableFuture<T>> futures = suppliers.stream()
        .map(supplier -> CompletableFuture.supplyAsync(() -> {
          try {
            semaphore.acquire();
            return supplier.get();
          } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Interrupted while waiting for semaphore", e);
          } finally {
            semaphore.release();
          }
        }, virtualExecutorService))
        .toList();

    List<T> results = futures.stream()
        .map(CompletableFuture::join)
        .collect(Collectors.toList());

    log.debug("Parallel execution of {} operations (max {} concurrent) completed in {}ms",
        suppliers.size(), maxConcurrent, System.currentTimeMillis() - startTime);

    return results;
  }

  /**
   * Simple pair class for returning two typed results
   */
  public record Pair<A, B>(A first, B second) {
  }

  /**
   * Simple triple class for returning three typed results
   */
  public record Triple<A, B, C>(A first, B second, C third) {
  }
}
