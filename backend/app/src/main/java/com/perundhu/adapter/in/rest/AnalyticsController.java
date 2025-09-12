package com.perundhu.adapter.in.rest;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.dto.HistoricalAnalyticsDTO;
import com.perundhu.application.service.BusAnalyticsService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * Controller for analytics-related operations
 */
@RestController
@RequestMapping("/api/v1/analytics")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
@Slf4j
public class AnalyticsController {

    private static final Logger log = LoggerFactory.getLogger(AnalyticsController.class);

    private final BusAnalyticsService analyticsService;

    // Request records for better type safety and immutability
    private record HistoricalRequest(
            Long fromLocationId,
            Long toLocationId,
            Long busId,
            LocalDate startDate,
            LocalDate endDate,
            String dataType,
            int page,
            int pageSize) {
        // Using compact constructor for validation
        public HistoricalRequest {
            if (page < 1)
                page = 1;
            if (pageSize < 1 || pageSize > 100)
                pageSize = 10;
        }
    }

    private record ExportRequest(
            String timeRange,
            Long fromLocationId,
            Long toLocationId,
            Long busId,
            String format) {
    }

    private record DepartureRequest(
            Long fromLocationId,
            Long toLocationId,
            String desiredArrivalTime) {
    }

    // Response records
    private record ErrorResponse(String error) {
    }

    // Using sealed types for better modeling of time range variations
    private sealed interface TimeRangeProvider permits DayRange, WeekRange, MonthRange {
        LocalDateTime getStartDateTime(LocalDateTime endDateTime);

        String getDescription();
    }

    private record DayRange() implements TimeRangeProvider {
        @Override
        public LocalDateTime getStartDateTime(LocalDateTime endDateTime) {
            return endDateTime.minusDays(1);
        }

        @Override
        public String getDescription() {
            return "Last 24 hours";
        }
    }

    private record WeekRange() implements TimeRangeProvider {
        @Override
        public LocalDateTime getStartDateTime(LocalDateTime endDateTime) {
            return endDateTime.minusWeeks(1);
        }

        @Override
        public String getDescription() {
            return "Last 7 days";
        }
    }

    private record MonthRange() implements TimeRangeProvider {
        @Override
        public LocalDateTime getStartDateTime(LocalDateTime endDateTime) {
            return endDateTime.minusMonths(1);
        }

        @Override
        public String getDescription() {
            return "Last 30 days";
        }
    }

    // Use this factory method instead of enum
    private TimeRangeProvider getTimeRange(String timeRange) {
        return switch (timeRange.toLowerCase()) {
            case "day" -> new DayRange();
            case "week" -> new WeekRange();
            case "month" -> new MonthRange();
            default -> throw new IllegalArgumentException("Invalid time range: " + timeRange);
        };
    }

    /**
     * Get historical analytics data based on specified parameters
     */
    @GetMapping("/historical")
    public ResponseEntity<HistoricalAnalyticsDTO> getHistoricalData(
            @RequestParam(value = "fromLocationId", required = false) Long fromLocationId,
            @RequestParam(value = "toLocationId", required = false) Long toLocationId,
            @RequestParam(value = "busId", required = false) Long busId,
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(value = "dataType", defaultValue = "punctuality") String dataType,
            @RequestParam(value = "page", defaultValue = "1") int page,
            @RequestParam(value = "pageSize", defaultValue = "10") int pageSize) {

        var request = new HistoricalRequest(fromLocationId, toLocationId, busId, startDate, endDate, dataType, page,
                pageSize);

        log.info("Fetching historical analytics: {}", request);

        var startDateTime = request.startDate() != null
                ? request.startDate().atStartOfDay()
                : LocalDate.now().minusDays(7).atStartOfDay();

        var endDateTime = request.endDate() != null
                ? request.endDate().atTime(23, 59, 59)
                : LocalDateTime.now();

        var data = analyticsService.getHistoricalData(
                request.fromLocationId(),
                request.toLocationId(),
                request.busId(),
                startDateTime,
                endDateTime,
                request.dataType(),
                request.page(),
                request.pageSize());

        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(30, TimeUnit.MINUTES))
                .body(data);
    }

    /**
     * Get recommended departure times based on historical performance
     */
    @GetMapping("/recommended-departure")
    public ResponseEntity<?> getRecommendedDepartureTimes(
            @RequestParam("fromLocationId") Long fromLocationId,
            @RequestParam("toLocationId") Long toLocationId,
            @RequestParam("desiredArrivalTime") String desiredArrivalTime) {

        var request = new DepartureRequest(fromLocationId, toLocationId, desiredArrivalTime);
        log.info("Getting recommended departure times: {}", request);

        try {
            var now = LocalDateTime.now();
            var formatter = DateTimeFormatter.ofPattern("HH:mm");
            var timeParts = request.desiredArrivalTime().split(":");

            if (timeParts.length != 2) {
                throw new IllegalArgumentException("Time format must be HH:mm");
            }

            var hour = Integer.parseInt(timeParts[0]);
            var minute = Integer.parseInt(timeParts[1]);

            if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
                throw new IllegalArgumentException("Invalid time values");
            }

            var arrivalDateTime = now.withHour(hour)
                    .withMinute(minute)
                    .withSecond(0)
                    .withNano(0);

            // If the time has already passed today, use tomorrow
            if (arrivalDateTime.isBefore(now)) {
                arrivalDateTime = arrivalDateTime.plusDays(1);
            }

            var recommendations = analyticsService.getRecommendedDepartureTimes(
                    request.fromLocationId(),
                    request.toLocationId(),
                    arrivalDateTime);

            return ResponseEntity.ok(recommendations);

        } catch (Exception e) {
            log.error("Error processing request", e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid request: " + e.getMessage()));
        }
    }

    /**
     * Get popular routes for a given time period
     */
    @GetMapping("/popular-routes")
    public ResponseEntity<Map<String, Object>> getPopularRoutes(
            @RequestParam(value = "timeRange", defaultValue = "week") String timeRange) {

        log.info("Getting popular routes for time range: {}", timeRange);

        try {
            var endDateTime = LocalDateTime.now();
            var timeRangeProvider = getTimeRange(timeRange);
            var startDateTime = timeRangeProvider.getStartDateTime(endDateTime);

            var popularRoutes = analyticsService.getPopularRoutes(startDateTime, endDateTime);

            return ResponseEntity.ok()
                    .cacheControl(CacheControl.maxAge(1, TimeUnit.HOURS))
                    .body(popularRoutes);
        } catch (IllegalArgumentException e) {
            log.error("Invalid time range specified", e);
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid time range: " + timeRange));
        }
    }

    /**
     * Export analytics data to CSV
     */
    @GetMapping("/export")
    public ResponseEntity<?> exportAnalyticsData(
            @RequestParam(value = "timeRange", defaultValue = "week") String timeRange,
            @RequestParam(value = "fromLocationId", required = false) Long fromLocationId,
            @RequestParam(value = "toLocationId", required = false) Long toLocationId,
            @RequestParam(value = "busId", required = false) Long busId,
            @RequestParam(value = "format", defaultValue = "csv") String format) {

        var request = new ExportRequest(timeRange, fromLocationId, toLocationId, busId, format);
        log.info("Exporting analytics data: {}", request);

        try {
            var endDateTime = LocalDateTime.now();
            var timeRangeProvider = getTimeRange(request.timeRange());
            var startDateTime = timeRangeProvider.getStartDateTime(endDateTime);

            // Pattern matching for instanceof with type patterns (Java 17)
            if (!(format.equals("csv") || format.equals("json") || format.equals("excel"))) {
                return ResponseEntity.badRequest()
                        .body(new ErrorResponse("Unsupported format: " + format + ". Use csv, json, or excel"));
            }

            var data = analyticsService.exportAnalyticsData(
                    request.fromLocationId(),
                    request.toLocationId(),
                    request.busId(),
                    startDateTime,
                    endDateTime,
                    request.format());

            var contentType = switch (request.format()) {
                case "csv" -> "text/csv";
                case "json" -> "application/json";
                case "excel" -> "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
                default -> "application/octet-stream";
            };

            var fileExtension = switch (request.format()) {
                case "excel" -> "xlsx";
                default -> request.format();
            };

            var filename = "perundhu_analytics_%s_%s.%s".formatted(
                    request.timeRange(),
                    LocalDate.now(),
                    fileExtension);

            return ResponseEntity.ok()
                    .header("Content-Disposition", "attachment; filename=\"" + filename + "\"")
                    .header("Content-Type", contentType)
                    .body(data);

        } catch (IllegalArgumentException e) {
            log.error("Invalid request parameters", e);
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse("Invalid request: " + e.getMessage()));
        }
    }
}