package com.perundhu.adapter.in.rest;

import com.perundhu.application.service.BusTimingRecordIntegrationService;
import com.perundhu.domain.model.TimingImageContribution;
import com.perundhu.domain.model.TimingImageContribution.TimingImageStatus;
import com.perundhu.domain.model.ExtractedBusTiming;
import com.perundhu.domain.model.BusTimingRecord;
import com.perundhu.domain.model.SkippedTimingRecord;
import com.perundhu.domain.port.TimingImageContributionRepository;
import com.perundhu.domain.port.BusTimingRecordRepository;
import com.perundhu.domain.port.SkippedTimingRecordRepository;
import com.perundhu.domain.port.GeminiVisionService;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;

/**
 * REST Controller for admin timing image contribution management
 * Handles OCR extraction, approval, and rejection workflows
 */
@RestController
@RequestMapping("/api/v1/admin/contributions/timing-images")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*")
public class TimingImageAdminController {

  private final TimingImageContributionRepository timingImageRepository;
  private final BusTimingRecordRepository busTimingRecordRepository;
  private final SkippedTimingRecordRepository skippedTimingRecordRepository;
  private final GeminiVisionService geminiVisionService;
  private final BusTimingRecordIntegrationService busTimingRecordIntegrationService;

  /**
   * Get all pending timing image contributions for admin review
   * GET /api/v1/admin/contributions/timing-images/pending
   */
  @GetMapping("/pending")
  public ResponseEntity<List<TimingImageContribution>> getPendingContributions() {
    try {
      log.info("Fetching pending timing contributions for admin review");

      List<TimingImageContribution> pending = timingImageRepository.findPendingContributions();
      log.info("Found {} pending timing contributions", pending.size());

      return ResponseEntity.ok(pending);

    } catch (Exception e) {
      log.error("Error fetching pending timing contributions", e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Extract timings from image using Gemini Vision AI
   * POST /api/v1/admin/contributions/timing-images/{id}/extract
   */
  @PostMapping("/{id}/extract")
  public ResponseEntity<Map<String, Object>> extractTimings(@PathVariable Long id) {
    try {
      log.info("Extracting timings from contribution: {}", id);

      // Get contribution
      TimingImageContribution contribution = timingImageRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Contribution not found: " + id));

      // Check if Gemini Vision is available
      if (!geminiVisionService.isAvailable()) {
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
            .body(Map.of("error", "AI image processing service not available"));
      }

      // Update status to PROCESSING
      contribution.setStatus(TimingImageStatus.PROCESSING);
      timingImageRepository.save(contribution);

      // Run Gemini Vision extraction
      Map<String, Object> result = geminiVisionService.extractBusScheduleFromImage(contribution.getImageUrl());

      if (result == null || result.isEmpty() || result.containsKey("error")) {
        contribution.setStatus(TimingImageStatus.PENDING);
        contribution
            .setValidationMessage("AI extraction failed: " + (result != null ? result.get("error") : "empty response"));
        timingImageRepository.save(contribution);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
            .body(Map.of("error", "Could not extract timings from image"));
      }

      // Convert Gemini result to ExtractedBusTiming list
      List<ExtractedBusTiming> extractedTimings = convertGeminiResultToTimings(id, result);

      // Save extracted timings to contribution
      contribution.setExtractedTimings(extractedTimings);
      double confidence = result.containsKey("confidence")
          ? ((Number) result.get("confidence")).doubleValue()
          : 0.8;
      contribution.setOcrConfidence(java.math.BigDecimal.valueOf(confidence));
      contribution.setRequiresManualReview(confidence < 0.7);
      timingImageRepository.save(contribution);

      log.info("Gemini extraction completed with confidence: {}", confidence);

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error extracting timings from contribution: {}", id, e);

      // Update status back to PENDING on error
      timingImageRepository.findById(id).ifPresent(c -> {
        c.setStatus(TimingImageStatus.PENDING);
        c.setValidationMessage("AI extraction failed: " + e.getMessage());
        timingImageRepository.save(c);
      });

      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(Map.of("error", e.getMessage()));
    }
  }

  /**
   * Convert Gemini Vision result to ExtractedBusTiming list
   */
  @SuppressWarnings("unchecked")
  private List<ExtractedBusTiming> convertGeminiResultToTimings(Long contributionId, Map<String, Object> result) {
    List<ExtractedBusTiming> timings = new ArrayList<>();

    // Handle routes array from Gemini
    if (result.containsKey("routes")) {
      List<Map<String, Object>> routes = (List<Map<String, Object>>) result.get("routes");
      for (Map<String, Object> route : routes) {
        String destination = (String) route.getOrDefault("toLocation",
            route.getOrDefault("destination", "Unknown"));
        List<String> departureTimes = (List<String>) route.getOrDefault("departureTimes",
            route.getOrDefault("timings", new ArrayList<>()));

        ExtractedBusTiming timing = ExtractedBusTiming.builder()
            .contributionId(contributionId)
            .destination(destination)
            .morningTimings(filterTimings(departureTimes, "MORNING"))
            .afternoonTimings(filterTimings(departureTimes, "AFTERNOON"))
            .nightTimings(filterTimings(departureTimes, "NIGHT"))
            .build();
        timings.add(timing);
      }
    }

    return timings;
  }

  /**
   * Filter timings by time of day
   */
  private List<String> filterTimings(List<String> allTimings, String period) {
    List<String> filtered = new ArrayList<>();
    for (String time : allTimings) {
      try {
        LocalTime parsed = parseTime(time);
        int hour = parsed.getHour();
        if (period.equals("MORNING") && hour >= 5 && hour < 12) {
          filtered.add(time);
        } else if (period.equals("AFTERNOON") && hour >= 12 && hour < 17) {
          filtered.add(time);
        } else if (period.equals("NIGHT") && (hour >= 17 || hour < 5)) {
          filtered.add(time);
        }
      } catch (Exception e) {
        // If can't parse, add to all periods
        filtered.add(time);
      }
    }
    return filtered;
  }

  /**
   * Approve timing image contribution and update database
   * POST /api/v1/admin/contributions/timing-images/{id}/approve
   */
  @PostMapping("/{id}/approve")
  @SuppressWarnings("unchecked")
  public ResponseEntity<TimingImageContribution> approveContribution(
      @PathVariable Long id,
      @RequestBody(required = false) Map<String, Object> extractedTimingsRequest) {

    try {
      log.info("Approving timing contribution: {}", id);

      // Get contribution
      TimingImageContribution contribution = timingImageRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Contribution not found: " + id));

      // If extracted timings provided in request, update them
      if (extractedTimingsRequest != null && extractedTimingsRequest.containsKey("timings")) {
        List<Map<String, Object>> timingsData = (List<Map<String, Object>>) extractedTimingsRequest.get("timings");
        List<ExtractedBusTiming> timings = new ArrayList<>();
        for (Map<String, Object> destTiming : timingsData) {
          ExtractedBusTiming timing = ExtractedBusTiming.builder()
              .contributionId(id)
              .destination((String) destTiming.get("destination"))
              .destinationTamil((String) destTiming.get("destinationTamil"))
              .morningTimings((List<String>) destTiming.getOrDefault("morningTimings", new ArrayList<>()))
              .afternoonTimings((List<String>) destTiming.getOrDefault("afternoonTimings", new ArrayList<>()))
              .nightTimings((List<String>) destTiming.getOrDefault("nightTimings", new ArrayList<>()))
              .build();
          timings.add(timing);
        }
        contribution.setExtractedTimings(timings);
      }

      // Process extracted timings and create bus timing records
      int createdCount = 0;
      int mergedCount = 0;

      if (contribution.getExtractedTimings() != null) {
        for (ExtractedBusTiming extracted : contribution.getExtractedTimings()) {
          // Process each timing type
          createdCount += processTimings(contribution, extracted, "MORNING", extracted.getMorningTimings());
          createdCount += processTimings(contribution, extracted, "AFTERNOON", extracted.getAfternoonTimings());
          createdCount += processTimings(contribution, extracted, "NIGHT", extracted.getNightTimings());
        }
      }

      // Update contribution status
      contribution.setStatus(TimingImageStatus.APPROVED);
      contribution.setProcessedDate(LocalDateTime.now());
      contribution.setProcessedBy("admin"); // TODO: Get actual admin user
      contribution.setCreatedRecords(createdCount);
      contribution.setMergedRecords(mergedCount);
      contribution.setValidationMessage("Approved and processed");

      TimingImageContribution saved = timingImageRepository.save(contribution);

      log.info("Timing contribution approved - created: {}, merged: {}", createdCount, mergedCount);

      // CRITICAL FIX: Integrate the timing records into the buses table
      // so they appear in search results
      try {
        log.info("Triggering integration of timing records into buses table...");
        var integrationResult = busTimingRecordIntegrationService.integrateAllPendingRecords();
        log.info("Integration complete: {} buses created, {} duplicates linked, {} failed",
            integrationResult.integratedCount(),
            integrationResult.skippedDuplicates(),
            integrationResult.failedCount());

        // Update validation message with integration result
        saved.setValidationMessage(String.format(
            "Approved and integrated: %d timing records created, %d buses added to search",
            createdCount, integrationResult.integratedCount()));
        saved = timingImageRepository.save(saved);
      } catch (Exception ie) {
        log.error("Integration failed after approval: {}", ie.getMessage(), ie);
        // Don't fail the approval, just log the error
        saved.setValidationMessage("Approved but integration pending: " + ie.getMessage());
        saved = timingImageRepository.save(saved);
      }

      return ResponseEntity.ok(saved);

    } catch (Exception e) {
      log.error("Error approving timing contribution: {}", id, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Reject timing image contribution
   * POST /api/v1/admin/contributions/timing-images/{id}/reject
   */
  @PostMapping("/{id}/reject")
  public ResponseEntity<TimingImageContribution> rejectContribution(
      @PathVariable Long id,
      @RequestBody Map<String, String> request) {

    try {
      String reason = request.get("reason");
      log.info("Rejecting timing contribution: {} - reason: {}", id, reason);

      TimingImageContribution contribution = timingImageRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Contribution not found: " + id));

      contribution.setStatus(TimingImageStatus.REJECTED);
      contribution.setValidationMessage(reason);
      contribution.setProcessedDate(LocalDateTime.now());
      contribution.setProcessedBy("admin"); // TODO: Get actual admin user

      TimingImageContribution saved = timingImageRepository.save(contribution);

      log.info("Timing contribution rejected");

      return ResponseEntity.ok(saved);

    } catch (Exception e) {
      log.error("Error rejecting timing contribution: {}", id, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Get skipped records for a contribution
   * GET /api/v1/admin/contributions/timing-images/{id}/skipped-records
   */
  @GetMapping("/{id}/skipped-records")
  public ResponseEntity<List<SkippedTimingRecord>> getSkippedRecords(@PathVariable Long id) {
    try {
      log.info("Fetching skipped records for contribution: {}", id);

      List<SkippedTimingRecord> skipped = skippedTimingRecordRepository.findByContributionId(id);
      return ResponseEntity.ok(skipped);

    } catch (Exception e) {
      log.error("Error fetching skipped records for contribution: {}", id, e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Helper method to process timings and create bus timing records
   */
  private int processTimings(TimingImageContribution contribution, ExtractedBusTiming extracted,
      String timingType, List<String> timings) {
    int created = 0;

    if (timings == null || timings.isEmpty()) {
      return 0;
    }

    for (String timeStr : timings) {
      try {
        LocalTime departureTime = parseTime(timeStr);

        // Check for duplicates - simplified check since repository method doesn't exist
        // yet
        // TODO: Implement proper duplicate checking with repository method
        boolean exists = false;

        if (exists) {
          // Create skipped record
          SkippedTimingRecord skipped = SkippedTimingRecord.builder()
              .contributionId(contribution.getId())
              .fromLocationName(contribution.getOriginLocation())
              .toLocationName(extracted.getDestination())
              .departureTime(departureTime)
              .timingType(BusTimingRecord.TimingType.valueOf(timingType))
              .skipReason(SkippedTimingRecord.SkipReason.DUPLICATE_EXACT)
              .notes("Duplicate timing already exists in database")
              .build();
          skippedTimingRecordRepository.save(skipped);
          log.debug("Skipped duplicate timing: {} -> {} at {}",
              contribution.getOriginLocation(), extracted.getDestination(), timeStr);
        } else {
          // Create new bus timing record
          BusTimingRecord record = BusTimingRecord.builder()
              .fromLocationName(contribution.getOriginLocation())
              .toLocationName(extracted.getDestination())
              .departureTime(departureTime)
              .timingType(BusTimingRecord.TimingType.valueOf(timingType))
              .source(BusTimingRecord.TimingSource.OCR_EXTRACTED)
              .contributionId(contribution.getId())
              .build();
          busTimingRecordRepository.save(record);
          created++;
          log.debug("Created bus timing: {} -> {} at {}",
              contribution.getOriginLocation(), extracted.getDestination(), timeStr);
        }

      } catch (Exception e) {
        log.warn("Failed to process timing: {} - {}", timeStr, e.getMessage());
        // Create skipped record for parse errors
        try {
          SkippedTimingRecord skipped = SkippedTimingRecord.builder()
              .contributionId(contribution.getId())
              .fromLocationName(contribution.getOriginLocation())
              .toLocationName(extracted.getDestination())
              .timingType(BusTimingRecord.TimingType.valueOf(timingType))
              .skipReason(SkippedTimingRecord.SkipReason.INVALID_TIME)
              .notes("Failed to parse time: " + timeStr + " - " + e.getMessage())
              .build();
          skippedTimingRecordRepository.save(skipped);
        } catch (Exception ex) {
          log.error("Failed to create skipped record", ex);
        }
      }
    }

    return created;
  }

  /**
   * Parse time string to LocalTime
   */
  private LocalTime parseTime(String timeStr) {
    // Handle various time formats: "06:30", "6:30 AM", "18:45", etc.
    timeStr = timeStr.trim().toUpperCase();

    try {
      // Remove AM/PM and parse
      boolean isPM = timeStr.contains("PM");
      boolean isAM = timeStr.contains("AM");
      timeStr = timeStr.replaceAll("[APM\\s]", "");

      String[] parts = timeStr.split(":");
      int hour = Integer.parseInt(parts[0]);
      int minute = parts.length > 1 ? Integer.parseInt(parts[1]) : 0;

      // Convert 12-hour to 24-hour format
      if (isPM && hour != 12) {
        hour += 12;
      } else if (isAM && hour == 12) {
        hour = 0;
      }

      return LocalTime.of(hour, minute);
    } catch (Exception e) {
      throw new IllegalArgumentException("Invalid time format: " + timeStr, e);
    }
  }
}
