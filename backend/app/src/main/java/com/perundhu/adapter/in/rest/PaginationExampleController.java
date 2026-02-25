package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.PaginatedResponse;
import com.perundhu.application.service.BusScheduleService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Example controller demonstrating pagination best practices
 * 
 * This controller shows how to use PaginatedResponse wrapper
 * for consistent pagination across all endpoints.
 * 
 * Key features:
 * - Consistent pagination structure
 * - Default page size limits
 * - Sorting support
 * - Total count for UI pagination controls
 */
@RestController
@RequestMapping("/v1/example-pagination")
@Tag(name = "Pagination Example", description = "Example endpoints demonstrating pagination best practices")
public class PaginationExampleController {

  private static final Logger log = LoggerFactory.getLogger(PaginationExampleController.class);
  private static final int DEFAULT_PAGE_SIZE = 20;
  private static final int MAX_PAGE_SIZE = 100;

  private final BusScheduleService busScheduleService;

  public PaginationExampleController(BusScheduleService busScheduleService) {
    this.busScheduleService = busScheduleService;
  }

  /**
   * Example: Paginated location list
   * 
   * URL: /api/v1/example-pagination/locations?page=0&size=20&sort=name,asc
   * 
   * Benefits:
   * - Prevents memory issues with large datasets
   * - Better frontend performance (load data incrementally)
   * - Supports infinite scroll patterns
   */
  @Operation(summary = "Get paginated locations", description = """
      Returns locations with pagination support.
      Use 'page' parameter for page number (0-indexed).
      Use 'size' parameter for items per page (default: 20, max: 100).
      Use 'sort' parameter for sorting (e.g., 'name,asc' or 'id,desc').
      """)
  @ApiResponses({
      @ApiResponse(responseCode = "200", description = "Locations retrieved successfully", content = @Content(schema = @Schema(implementation = PaginatedResponse.class))),
      @ApiResponse(responseCode = "400", description = "Invalid pagination parameters"),
      @ApiResponse(responseCode = "500", description = "Internal server error")
  })
  @GetMapping("/locations")
  public ResponseEntity<PaginatedResponse<LocationDTO>> getLocationsPaginated(
      @Parameter(description = "Page number (0-indexed)") @RequestParam(defaultValue = "0") int page,

      @Parameter(description = "Items per page (max: 100)") @RequestParam(defaultValue = "20") int size,

      @Parameter(description = "Sort field and direction (e.g., 'name,asc')") @RequestParam(defaultValue = "name,asc") String sort,

      @Parameter(description = "Language code (en, ta)") @RequestParam(defaultValue = "en") String lang) {
    log.info("Getting paginated locations: page={}, size={}, sort={}, lang={}",
        page, size, sort, lang);

    // Validate pagination parameters
    if (page < 0) {
      log.warn("Invalid page number: {}", page);
      return ResponseEntity.badRequest().build();
    }

    if (size <= 0 || size > MAX_PAGE_SIZE) {
      log.warn("Invalid page size: {} (must be between 1 and {})", size, MAX_PAGE_SIZE);
      return ResponseEntity.badRequest().build();
    }

    try {
      // Parse sort parameter
      String[] sortParts = sort.split(",");
      String sortField = sortParts[0];
      Sort.Direction direction = sortParts.length > 1 && "desc".equalsIgnoreCase(sortParts[1])
          ? Sort.Direction.DESC
          : Sort.Direction.ASC;

      // Create pageable request
      Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sortField));

      // OPTION 1: If your service returns Spring Data Page
      // Page<LocationDTO> locationPage =
      // busScheduleService.getLocationsPaginated(pageable, lang);
      // return ResponseEntity.ok(PaginatedResponse.from(locationPage));

      // OPTION 2: If you need to manually build pagination
      // (This example shows manual pagination for demonstration)
      java.util.List<LocationDTO> allLocations = busScheduleService.getAllLocations(lang);

      // Calculate pagination
      int totalElements = allLocations.size();
      int totalPages = (int) Math.ceil((double) totalElements / size);
      int start = page * size;
      int end = Math.min(start + size, totalElements);

      // Extract current page
      java.util.List<LocationDTO> pageContent = start < totalElements
          ? allLocations.subList(start, end)
          : java.util.Collections.emptyList();

      // Build response
      PaginatedResponse<LocationDTO> response = PaginatedResponse.<LocationDTO>builder()
          .content(pageContent)
          .page(page)
          .size(size)
          .totalElements(totalElements)
          .totalPages(totalPages)
          .first(page == 0)
          .last(page >= totalPages - 1)
          .build();

      log.info("Returning page {} of {} (total {} locations)", page, totalPages, totalElements);
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error retrieving paginated locations", e);
      return ResponseEntity.internalServerError().build();
    }
  }

  /**
   * Example: Cursor-based pagination for infinite scroll
   * 
   * URL: /api/v1/example-pagination/locations-cursor?cursor=lastId&size=20
   * 
   * Benefits:
   * - Better for infinite scroll
   * - More efficient for large datasets
   * - Handles real-time data changes better
   */
  @Operation(summary = "Get locations with cursor-based pagination", description = """
      Returns locations using cursor-based pagination (better for infinite scroll).
      Use 'cursor' parameter for the last item ID from previous page.
      First request: don't include cursor parameter.
      Subsequent requests: use the last item ID from previous response.
      """)
  @GetMapping("/locations-cursor")
  public ResponseEntity<PaginatedResponse<LocationDTO>> getLocationsCursor(
      @Parameter(description = "Cursor (last item ID from previous page)") @RequestParam(required = false) Long cursor,

      @Parameter(description = "Items per page (max: 100)") @RequestParam(defaultValue = "20") int size,

      @Parameter(description = "Language code (en, ta)") @RequestParam(defaultValue = "en") String lang) {
    log.info("Getting locations with cursor pagination: cursor={}, size={}, lang={}",
        cursor, size, lang);

    if (size <= 0 || size > MAX_PAGE_SIZE) {
      return ResponseEntity.badRequest().build();
    }

    try {
      // In real implementation, you would query from cursor position
      // Example: SELECT * FROM locations WHERE id > cursor ORDER BY id LIMIT size

      java.util.List<LocationDTO> allLocations = busScheduleService.getAllLocations(lang);

      // Filter by cursor if provided
      java.util.List<LocationDTO> filteredLocations = cursor == null
          ? allLocations
          : allLocations.stream()
              .filter(loc -> loc.getId() > cursor)
              .toList();

      // Take next page
      java.util.List<LocationDTO> pageContent = filteredLocations.stream()
          .limit(size)
          .toList();

      boolean hasMore = filteredLocations.size() > size;

      PaginatedResponse<LocationDTO> response = PaginatedResponse.<LocationDTO>builder()
          .content(pageContent)
          .page(0) // Not applicable for cursor-based pagination
          .size(size)
          .totalElements(-1) // Unknown total with cursor pagination
          .totalPages(-1) // Unknown total pages
          .first(cursor == null)
          .last(!hasMore)
          .build();

      log.info("Returning {} locations, hasMore={}", pageContent.size(), hasMore);
      return ResponseEntity.ok(response);

    } catch (Exception e) {
      log.error("Error retrieving cursor-paginated locations", e);
      return ResponseEntity.internalServerError().build();
    }
  }
}
