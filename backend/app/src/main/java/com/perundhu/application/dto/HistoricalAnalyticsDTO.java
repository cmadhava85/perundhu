package com.perundhu.application.dto;

import java.util.List;

import com.perundhu.domain.model.BusAnalytics;

/**
 * DTO for historical analytics data
 */
public record HistoricalAnalyticsDTO(
    List<BusAnalytics> data,
    int totalCount,
    int page,
    int pageSize
) {
    /**
     * Factory method to create a new HistoricalAnalyticsDTO instance
     */
    public static HistoricalAnalyticsDTO of(List<BusAnalytics> data, int totalCount, int page, int pageSize) {
        return new HistoricalAnalyticsDTO(data, totalCount, page, pageSize);
    }

    /**
     * Factory method to create a builder for backward compatibility
     */
    public static Builder builder() {
        return new Builder();
    }

    /**
     * Builder class for HistoricalAnalyticsDTO
     */
    public static class Builder {
        private List<BusAnalytics> data;
        private int totalCount;
        private int page;
        private int pageSize;

        public Builder data(List<BusAnalytics> data) {
            this.data = data;
            return this;
        }

        public Builder totalCount(int totalCount) {
            this.totalCount = totalCount;
            return this;
        }

        public Builder page(int page) {
            this.page = page;
            return this;
        }

        public Builder pageSize(int pageSize) {
            this.pageSize = pageSize;
            return this;
        }

        public HistoricalAnalyticsDTO build() {
            return new HistoricalAnalyticsDTO(data, totalCount, page, pageSize);
        }
    }
}
