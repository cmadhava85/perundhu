package com.perundhu.application.service;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.dto.LocationDTO;

import io.github.resilience4j.bulkhead.annotation.Bulkhead;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import reactor.core.publisher.Mono;

/**
 * Reactive OpenStreetMap Geocoding Service using WebClient.
 * 
 * This service demonstrates modern reactive patterns for external API calls:
 * - Non-blocking I/O with WebClient
 * - Reactive streams (Mono/Flux) for async operations
 * - CompletableFuture bridge for integration with non-reactive code
 * - Circuit breaker, retry, and bulkhead patterns for resilience
 * 
 * Benefits over traditional RestTemplate/HttpClient:
 * - Better resource utilization (no thread blocking on I/O)
 * - Built-in reactive operators for transformation
 * - Seamless integration with Spring WebFlux ecosystem
 * - Works efficiently with virtual threads
 */
@Service
@ConditionalOnProperty(name = "app.webclient.enabled", havingValue = "true", matchIfMissing = true)
public class ReactiveGeocodingService {

  private static final Logger log = LoggerFactory.getLogger(ReactiveGeocodingService.class);
  private static final String ADDRESS_KEY = "address";

  private final WebClient osmWebClient;
  private final ObjectMapper objectMapper;

  public ReactiveGeocodingService(
      @Qualifier("osmWebClient") WebClient osmWebClient) {
    this.osmWebClient = osmWebClient;
    this.objectMapper = new ObjectMapper();
  }

  /**
   * Search for locations reactively - returns Mono for non-blocking composition.
   * 
   * Use this when you want to compose with other reactive operations:
   * 
   * <pre>
   * reactiveGeocodingService.searchLocationsReactive("Chennai", 5)
   *     .flatMap(locations -> saveToDatabase(locations))
   *     .subscribe();
   * </pre>
   */
  @CircuitBreaker(name = "osm", fallbackMethod = "searchLocationsFallback")
  @Bulkhead(name = "osm")
  @Retry(name = "externalApi")
  public Mono<List<LocationDTO>> searchLocationsReactive(String query, int limit) {
    if (query == null || query.trim().length() < 3) {
      return Mono.just(List.of());
    }

    String searchQuery = query.trim() + ", Tamil Nadu, India";
    String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);

    log.debug("Searching OSM reactively for: {}", query);

    return osmWebClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/search")
            .queryParam("q", encodedQuery)
            .queryParam("format", "json")
            .queryParam("limit", limit * 2) // Fetch more to filter
            .queryParam("addressdetails", 1)
            .queryParam("countrycodes", "in")
            .build())
        .retrieve()
        .bodyToMono(String.class)
        .timeout(Duration.ofSeconds(10))
        .map(body -> parseResults(body, limit))
        .doOnSuccess(results -> log.info("OSM reactive search for '{}' returned {} results", query, results.size()))
        .doOnError(error -> log.error("OSM reactive search failed for '{}': {}", query, error.getMessage()))
        .onErrorReturn(List.of());
  }

  /**
   * Search locations and return as CompletableFuture.
   * Use this when integrating with existing non-reactive code.
   * 
   * <pre>
   * CompletableFuture<List<LocationDTO>> future = service.searchLocationsAsync("Chennai", 5);
   * // Can be combined with other CompletableFutures
   * future.thenAccept(locations -> processLocations(locations));
   * </pre>
   */
  public CompletableFuture<List<LocationDTO>> searchLocationsAsync(String query, int limit) {
    return searchLocationsReactive(query, limit)
        .toFuture();
  }

  /**
   * Search locations synchronously (blocking).
   * Provided for backwards compatibility - prefer reactive or async methods.
   */
  public List<LocationDTO> searchLocationsBlocking(String query, int limit) {
    return searchLocationsReactive(query, limit)
        .block(Duration.ofSeconds(15));
  }

  /**
   * Get coordinates for a location reactively.
   * Returns Mono<double[]> where array is [latitude, longitude].
   */
  @CircuitBreaker(name = "osm", fallbackMethod = "getCoordinatesFallback")
  @Retry(name = "externalApi")
  public Mono<double[]> getCoordinatesReactive(String locationName) {
    if (locationName == null || locationName.trim().isEmpty()) {
      return Mono.empty();
    }

    String searchQuery = locationName.trim() + ", Tamil Nadu, India";
    String encodedQuery = URLEncoder.encode(searchQuery, StandardCharsets.UTF_8);

    return osmWebClient.get()
        .uri(uriBuilder -> uriBuilder
            .path("/search")
            .queryParam("q", encodedQuery)
            .queryParam("format", "json")
            .queryParam("limit", 1)
            .build())
        .retrieve()
        .bodyToMono(String.class)
        .timeout(Duration.ofSeconds(10))
        .mapNotNull(body -> parseCoordinates(body))
        .doOnSuccess(coords -> {
          if (coords != null) {
            log.debug("Got coordinates for '{}': [{}, {}]", locationName, coords[0], coords[1]);
          }
        });
  }

  /**
   * Get coordinates as CompletableFuture for async composition.
   */
  public CompletableFuture<double[]> getCoordinatesAsync(String locationName) {
    return getCoordinatesReactive(locationName)
        .toFuture();
  }

  /**
   * Batch lookup coordinates for multiple locations in parallel.
   * Efficient for updating multiple locations at once.
   */
  public Mono<List<LocationWithCoords>> batchGetCoordinates(List<String> locationNames) {
    if (locationNames == null || locationNames.isEmpty()) {
      return Mono.just(List.of());
    }

    // Execute all lookups in parallel using Mono.zip pattern
    List<Mono<LocationWithCoords>> monos = locationNames.stream()
        .map(name -> getCoordinatesReactive(name)
            .map(coords -> new LocationWithCoords(name, coords))
            .defaultIfEmpty(new LocationWithCoords(name, null)))
        .toList();

    return Mono.zip(monos, results -> {
      List<LocationWithCoords> list = new ArrayList<>();
      for (Object result : results) {
        list.add((LocationWithCoords) result);
      }
      return list;
    });
  }

  // ============================================
  // PRIVATE HELPER METHODS
  // ============================================

  private List<LocationDTO> parseResults(String jsonBody, int limit) {
    try {
      JsonNode results = objectMapper.readTree(jsonBody);
      List<LocationDTO> locations = new ArrayList<>();

      for (JsonNode result : results) {
        if (locations.size() >= limit)
          break;

        String displayName = result.has("display_name")
            ? result.get("display_name").asText()
            : "";

        // Skip if not in Tamil Nadu
        if (!isInTamilNadu(result, displayName))
          continue;

        String name = extractPlaceName(result, displayName);
        locations.add(LocationDTO.of(null, name));
      }

      return locations;
    } catch (Exception e) {
      log.error("Error parsing OSM results: {}", e.getMessage());
      return List.of();
    }
  }

  private double[] parseCoordinates(String jsonBody) {
    try {
      JsonNode results = objectMapper.readTree(jsonBody);
      if (results.isArray() && !results.isEmpty()) {
        JsonNode first = results.get(0);
        double lat = first.get("lat").asDouble();
        double lon = first.get("lon").asDouble();
        return new double[] { lat, lon };
      }
    } catch (Exception e) {
      log.error("Error parsing coordinates: {}", e.getMessage());
    }
    return null;
  }

  private String extractPlaceName(JsonNode result, String displayName) {
    if (result.has(ADDRESS_KEY)) {
      JsonNode address = result.get(ADDRESS_KEY);
      String[] placeTypes = { "village", "town", "city", "county" };
      for (String type : placeTypes) {
        if (address.has(type)) {
          return address.get(type).asText();
        }
      }
    }
    if (displayName.contains(",")) {
      return displayName.split(",")[0].trim();
    }
    return displayName;
  }

  private boolean isInTamilNadu(JsonNode result, String displayName) {
    String lowerDisplay = displayName.toLowerCase();
    if (lowerDisplay.contains("tamil nadu") || lowerDisplay.contains("tamilnadu")) {
      return true;
    }
    if (result.has(ADDRESS_KEY)) {
      JsonNode address = result.get(ADDRESS_KEY);
      if (address.has("state")) {
        String state = address.get("state").asText().toLowerCase();
        return state.contains("tamil nadu") || state.contains("tamilnadu");
      }
    }
    return false;
  }

  // ============================================
  // FALLBACK METHODS
  // ============================================

  @SuppressWarnings("unused")
  private Mono<List<LocationDTO>> searchLocationsFallback(String query, int limit, Throwable t) {
    log.warn("OSM circuit breaker triggered for reactive search. Query: '{}', Error: {}",
        query, t.getMessage());
    return Mono.just(List.of());
  }

  @SuppressWarnings("unused")
  private Mono<double[]> getCoordinatesFallback(String locationName, Throwable t) {
    log.warn("OSM circuit breaker triggered for coordinate lookup. Location: '{}', Error: {}",
        locationName, t.getMessage());
    return Mono.empty();
  }

  // ============================================
  // HELPER RECORDS
  // ============================================

  /**
   * Record to hold location name with its coordinates
   */
  public record LocationWithCoords(String locationName, double[] coordinates) {
    public boolean hasCoordinates() {
      return coordinates != null && coordinates.length == 2;
    }

    public Double latitude() {
      return hasCoordinates() ? coordinates[0] : null;
    }

    public Double longitude() {
      return hasCoordinates() ? coordinates[1] : null;
    }
  }
}
