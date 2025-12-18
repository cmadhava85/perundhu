package com.perundhu.application.service;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import com.perundhu.application.dto.BusDTO;
import com.perundhu.application.service.ParallelExecutionService.Triple;

/**
 * Enhanced Bus Search Service using Java 21 Virtual Threads for parallel
 * execution.
 * 
 * This service demonstrates how to use virtual threads and CompletableFuture
 * to execute independent database queries in parallel, significantly reducing
 * response time for complex searches.
 * 
 * Key patterns demonstrated:
 * 1. Parallel database queries using CompletableFuture
 * 2. Virtual thread executor for efficient I/O-bound operations
 * 3. Result aggregation from multiple parallel operations
 * 4. Error handling in parallel execution
 * 
 * Performance improvement example:
 * - Sequential: 3 queries × 50ms each = 150ms total
 * - Parallel: 3 queries in parallel = ~50ms total (3x faster!)
 */
@Service
@ConditionalOnProperty(name = "spring.threads.virtual.enabled", havingValue = "true")
public class ParallelBusSearchService {

  private static final Logger log = LoggerFactory.getLogger(ParallelBusSearchService.class);

  private final BusScheduleService busScheduleService;
  private final ExecutorService virtualExecutorService;
  private final ParallelExecutionService parallelExecutor;

  public ParallelBusSearchService(
      BusScheduleService busScheduleService,
      @Qualifier("virtualExecutorService") ExecutorService virtualExecutorService,
      ParallelExecutionService parallelExecutor) {
    this.busScheduleService = busScheduleService;
    this.virtualExecutorService = virtualExecutorService;
    this.parallelExecutor = parallelExecutor;
  }

  /**
   * Comprehensive bus search executing all query types in parallel.
   * 
   * This method executes three independent database queries simultaneously:
   * 1. Direct buses between locations
   * 2. Buses passing through as intermediate stops
   * 3. Buses continuing beyond the destination
   * 
   * Using virtual threads, all three queries run concurrently, reducing
   * total response time from sum of all queries to approximately the
   * duration of the slowest query.
   * 
   * @param fromLocationId    Origin location ID
   * @param toLocationId      Destination location ID
   * @param lang              Language code for translations
   * @param includeContinuing Whether to include buses continuing beyond
   *                          destination
   * @return Combined, deduplicated list of all matching buses
   */
  public List<BusDTO> searchBusesParallel(
      Long fromLocationId,
      Long toLocationId,
      String lang,
      boolean includeContinuing) {

    long startTime = System.currentTimeMillis();
    log.info("Starting parallel bus search from {} to {}", fromLocationId, toLocationId);

    // Execute all three queries in parallel using the type-safe Triple method
    Triple<List<BusDTO>, List<BusDTO>, List<BusDTO>> results = parallelExecutor.executeTriple(
        // Query 1: Direct buses
        () -> {
          log.debug("Executing direct bus query...");
          return busScheduleService.findBusesBetweenLocations(fromLocationId, toLocationId, lang);
        },
        // Query 2: Via intermediate stops
        () -> {
          log.debug("Executing via-stops query...");
          return busScheduleService.findBusesPassingThroughLocations(fromLocationId, toLocationId, lang);
        },
        // Query 3: Continuing buses (only if enabled)
        () -> {
          if (includeContinuing) {
            log.debug("Executing continuing-buses query...");
            return busScheduleService.findBusesContinuingBeyondDestination(fromLocationId, toLocationId);
          }
          return List.of();
        });

    // Combine and deduplicate results
    List<BusDTO> combinedResults = mergeAndDeduplicate(
        results.first(), // Direct buses
        results.second(), // Via intermediate stops
        results.third() // Continuing buses
    );

    long duration = System.currentTimeMillis() - startTime;
    log.info("Parallel bus search completed in {}ms. Found {} direct, {} via stops, {} continuing = {} total unique",
        duration,
        results.first().size(),
        results.second().size(),
        results.third().size(),
        combinedResults.size());

    return combinedResults;
  }

  /**
   * Alternative implementation using raw CompletableFuture for more control.
   * 
   * This approach is useful when you need:
   * - Custom timeout handling per query
   * - Different error handling strategies
   * - Partial results on failure
   */
  public List<BusDTO> searchBusesWithCompletableFuture(
      Long fromLocationId,
      Long toLocationId,
      String lang,
      boolean includeContinuing) {

    long startTime = System.currentTimeMillis();

    // Create CompletableFutures for each query
    CompletableFuture<List<BusDTO>> directBusesFuture = CompletableFuture.supplyAsync(
        () -> busScheduleService.findBusesBetweenLocations(fromLocationId, toLocationId, lang),
        virtualExecutorService).exceptionally(ex -> {
          log.error("Direct buses query failed: {}", ex.getMessage());
          return List.of();
        });

    CompletableFuture<List<BusDTO>> viaBusesFuture = CompletableFuture.supplyAsync(
        () -> busScheduleService.findBusesPassingThroughLocations(fromLocationId, toLocationId, lang),
        virtualExecutorService).exceptionally(ex -> {
          log.error("Via-stops query failed: {}", ex.getMessage());
          return List.of();
        });

    CompletableFuture<List<BusDTO>> continuingBusesFuture = includeContinuing
        ? CompletableFuture.supplyAsync(
            () -> busScheduleService.findBusesContinuingBeyondDestination(fromLocationId, toLocationId),
            virtualExecutorService).exceptionally(ex -> {
              log.error("Continuing buses query failed: {}", ex.getMessage());
              return List.of();
            })
        : CompletableFuture.completedFuture(List.of());

    // Wait for all futures to complete
    CompletableFuture.allOf(directBusesFuture, viaBusesFuture, continuingBusesFuture).join();

    // Collect results (all futures are complete, join() won't block)
    List<BusDTO> combinedResults = mergeAndDeduplicate(
        directBusesFuture.join(),
        viaBusesFuture.join(),
        continuingBusesFuture.join());

    log.info("CompletableFuture search completed in {}ms with {} results",
        System.currentTimeMillis() - startTime, combinedResults.size());

    return combinedResults;
  }

  /**
   * Search with structured concurrency (Java 21 preview feature pattern).
   * 
   * This demonstrates how to handle partial failures gracefully,
   * returning results from successful queries even if others fail.
   */
  public record SearchResult(
      List<BusDTO> directBuses,
      List<BusDTO> viaBuses,
      List<BusDTO> continuingBuses,
      List<String> errors) {
    public List<BusDTO> allBuses() {
      Set<Long> seenIds = new HashSet<>();
      List<BusDTO> all = new ArrayList<>();

      for (BusDTO bus : directBuses) {
        if (seenIds.add(bus.id()))
          all.add(bus);
      }
      for (BusDTO bus : viaBuses) {
        if (seenIds.add(bus.id()))
          all.add(bus);
      }
      for (BusDTO bus : continuingBuses) {
        if (seenIds.add(bus.id()))
          all.add(bus);
      }

      return all;
    }

    public int totalCount() {
      return allBuses().size();
    }

    public boolean hasErrors() {
      return !errors.isEmpty();
    }
  }

  /**
   * Search returning structured result with error information.
   */
  public SearchResult searchBusesStructured(
      Long fromLocationId,
      Long toLocationId,
      String lang,
      boolean includeContinuing) {

    List<String> errors = new ArrayList<>();

    // Execute queries with individual error handling
    CompletableFuture<List<BusDTO>> directFuture = CompletableFuture.supplyAsync(
        () -> busScheduleService.findBusesBetweenLocations(fromLocationId, toLocationId, lang),
        virtualExecutorService).handle((result, ex) -> {
          if (ex != null) {
            errors.add("Direct buses query failed: " + ex.getMessage());
            return List.<BusDTO>of();
          }
          return result;
        });

    CompletableFuture<List<BusDTO>> viaFuture = CompletableFuture.supplyAsync(
        () -> busScheduleService.findBusesPassingThroughLocations(fromLocationId, toLocationId, lang),
        virtualExecutorService).handle((result, ex) -> {
          if (ex != null) {
            errors.add("Via-stops query failed: " + ex.getMessage());
            return List.<BusDTO>of();
          }
          return result;
        });

    CompletableFuture<List<BusDTO>> continuingFuture = includeContinuing
        ? CompletableFuture.supplyAsync(
            () -> busScheduleService.findBusesContinuingBeyondDestination(fromLocationId, toLocationId),
            virtualExecutorService).handle((result, ex) -> {
              if (ex != null) {
                errors.add("Continuing buses query failed: " + ex.getMessage());
                return List.<BusDTO>of();
              }
              return result;
            })
        : CompletableFuture.completedFuture(List.of());

    // Wait for all
    CompletableFuture.allOf(directFuture, viaFuture, continuingFuture).join();

    return new SearchResult(
        directFuture.join(),
        viaFuture.join(),
        continuingFuture.join(),
        errors);
  }

  /**
   * Merge multiple bus lists and remove duplicates based on bus ID.
   */
  @SafeVarargs
  private List<BusDTO> mergeAndDeduplicate(List<BusDTO>... lists) {
    Set<Long> seenIds = new HashSet<>();
    List<BusDTO> result = new ArrayList<>();

    for (List<BusDTO> list : lists) {
      for (BusDTO bus : list) {
        if (seenIds.add(bus.id())) {
          result.add(bus);
        }
      }
    }

    return result;
  }
}
