package com.perundhu.adapter.in.rest.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * Generic paginated response wrapper
 * Provides consistent pagination metadata across all API endpoints
 * 
 * @param <T> The type of items in the response
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PaginatedResponse<T> {

  /**
   * The actual data items for the current page
   */
  private List<T> items;

  /**
   * Current page number (0-indexed)
   */
  private int page;

  /**
   * Number of items per page
   */
  private int pageSize;

  /**
   * Total number of items across all pages
   */
  private long totalItems;

  /**
   * Total number of pages
   */
  private int totalPages;

  /**
   * Whether there is a next page
   */
  private boolean hasNext;

  /**
   * Whether there is a previous page
   */
  private boolean hasPrevious;

  /**
   * Whether this is the first page
   */
  private boolean isFirst;

  /**
   * Whether this is the last page
   */
  private boolean isLast;

  /**
   * Create a paginated response from Spring Data Page
   */
  public static <T> PaginatedResponse<T> fromPage(org.springframework.data.domain.Page<T> page) {
    return PaginatedResponse.<T>builder()
        .items(page.getContent())
        .page(page.getNumber())
        .pageSize(page.getSize())
        .totalItems(page.getTotalElements())
        .totalPages(page.getTotalPages())
        .hasNext(page.hasNext())
        .hasPrevious(page.hasPrevious())
        .isFirst(page.isFirst())
        .isLast(page.isLast())
        .build();
  }

  /**
   * Create a simple paginated response
   */
  public static <T> PaginatedResponse<T> of(List<T> items, int page, int pageSize, long totalItems) {
    int totalPages = (int) Math.ceil((double) totalItems / pageSize);

    return PaginatedResponse.<T>builder()
        .items(items)
        .page(page)
        .pageSize(pageSize)
        .totalItems(totalItems)
        .totalPages(totalPages)
        .hasNext(page < totalPages - 1)
        .hasPrevious(page > 0)
        .isFirst(page == 0)
        .isLast(page == totalPages - 1)
        .build();
  }
}
