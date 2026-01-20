package com.perundhu.application.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.util.List;

/**
 * Generic paginated response wrapper for consistent pagination across all
 * endpoints
 * 
 * Features:
 * - Consistent pagination structure
 * - Supports cursor-based and offset-based pagination
 * - Includes metadata for UI pagination controls
 * - Compatible with Spring Data Page interface
 * 
 * @param <T> Type of content in the page
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record PaginatedResponse<T>(
    List<T> content,
    int page,
    int size,
    long totalElements,
    int totalPages,
    boolean first,
    boolean last,
    boolean empty) {

  /**
   * Create from Spring Data Page
   */
  public static <E> PaginatedResponse<E> from(org.springframework.data.domain.Page<E> page) {
    return new PaginatedResponse<>(
        page.getContent(),
        page.getNumber(),
        page.getSize(),
        page.getTotalElements(),
        page.getTotalPages(),
        page.isFirst(),
        page.isLast(),
        page.isEmpty());
  }

  /**
   * Builder pattern for manual construction
   */
  public static class Builder<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean first;
    private boolean last;
    private boolean empty;

    public Builder<T> content(List<T> content) {
      this.content = content;
      this.empty = content == null || content.isEmpty();
      return this;
    }

    public Builder<T> page(int page) {
      this.page = page;
      return this;
    }

    public Builder<T> size(int size) {
      this.size = size;
      return this;
    }

    public Builder<T> totalElements(long totalElements) {
      this.totalElements = totalElements;
      return this;
    }

    public Builder<T> totalPages(int totalPages) {
      this.totalPages = totalPages;
      return this;
    }

    public Builder<T> first(boolean first) {
      this.first = first;
      return this;
    }

    public Builder<T> last(boolean last) {
      this.last = last;
      return this;
    }

    public PaginatedResponse<T> build() {
      return new PaginatedResponse<>(content, page, size, totalElements, totalPages, first, last, empty);
    }
  }

  public static <T> Builder<T> builder() {
    return new Builder<>();
  }

  /**
   * Create empty response
   */
  public static <T> PaginatedResponse<T> empty() {
    return new PaginatedResponse<>(List.of(), 0, 0, 0, 0, true, true, true);
  }
}
