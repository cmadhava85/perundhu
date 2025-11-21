package com.perundhu.adapter.in.rest;

import com.perundhu.domain.model.TimingImageContribution;
import com.perundhu.domain.model.TimingImageContribution.TimingImageStatus;
import com.perundhu.domain.model.ExtractedBusTiming;
import com.perundhu.domain.model.BusTimingRecord;
import com.perundhu.domain.model.SkippedTimingRecord;
import com.perundhu.domain.port.TimingImageContributionRepository;
import com.perundhu.domain.port.BusTimingRecordRepository;
import com.perundhu.domain.port.SkippedTimingRecordRepository;
import com.perundhu.infrastructure.ocr.TesseractOcrService;

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
  private final TesseractOcrService ocrService;

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
   * Extract timings from image using OCR
   * POST /api/v1/admin/contributions/timing-images/{id}/extract
   */
  @PostMapping("/{id}/extract")
  public ResponseEntity<TesseractOcrService.TimingExtractionResult> extractTimings(@PathVariable Long id) {
    try {
      log.info("Extracting timings from contribution: {}", id);

      // Get contribution
      TimingImageContribution contribution = timingImageRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Contribution not found: " + id));

      // Update status to PROCESSING
      contribution.setStatus(TimingImageStatus.PROCESSING);
      timingImageRepository.save(contribution);

      // Run OCR extraction
      TesseractOcrService.TimingExtractionResult result = ocrService.extractTimings(
          contribution.getImageUrl(),
          contribution.getOriginLocation());

      // Convert to domain model ExtractedBusTiming
      List<ExtractedBusTiming> extractedTimings = new ArrayList<>();
      for (TesseractOcrService.ExtractedTiming destTiming : result.getTimings()) {
        ExtractedBusTiming timing = ExtractedBusTiming.builder()
            .contributionId(id)
            .destination(destTiming.getDestination())
            .destinationTamil(null) // OCR ExtractedTiming doesn't have Tamil field
            .morningTimings(destTiming.getMorningTimings())
            .afternoonTimings(destTiming.getAfternoonTimings())
            .nightTimings(destTiming.getNightTimings())
            .build();
        extractedTimings.add(timing);
      }

      // Save extracted timings to contribution
      contribution.setExtractedTimings(extractedTimings);
      if (result.getConfidence() != null) {
        contribution.setOcrConfidence(result.getConfidence());
        contribution.setRequiresManualReview(result.getConfidence().doubleValue() < 0.7);
      } else {
        contribution.setOcrConfidence(java.math.BigDecimal.ZERO);
        contribution.setRequiresManualReview(true);
      }
      timingImageRepository.save(contribution);

      log.info("OCR extraction completed with confidence: {}", result.getConfidence());

      return ResponseEntity.ok(result);

    } catch (Exception e) {
      log.error("Error extracting timings from contribution: {}", id, e);

      // Update status back to PENDING on error
      timingImageRepository.findById(id).ifPresent(c -> {
        c.setStatus(TimingImageStatus.PENDING);
        c.setValidationMessage("OCR extraction failed: " + e.getMessage());
        timingImageRepository.save(c);
      });

      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
    }
  }

  /**
   * Approve timing image contribution and update database
   * POST /api/v1/admin/contributions/timing-images/{id}/approve
   */
  @PostMapping("/{id}/approve")
  public ResponseEntity<TimingImageContribution> approveContribution(
      @PathVariable Long id,
      @RequestBody(required = false) TesseractOcrService.TimingExtractionResult extractedTimings) {

    try {
      log.info("Approving timing contribution: {}", id);

      // Get contribution
      TimingImageContribution contribution = timingImageRepository.findById(id)
          .orElseThrow(() -> new RuntimeException("Contribution not found: " + id));

      // If extracted timings provided, update them
      if (extractedTimings != null && extractedTimings.getTimings() != null) {
        List<ExtractedBusTiming> timings = new ArrayList<>();
        for (TesseractOcrService.ExtractedTiming destTiming : extractedTimings.getTimings()) {
          ExtractedBusTiming timing = ExtractedBusTiming.builder()
              .contributionId(id)
              .destination(destTiming.getDestination())
              .destinationTamil(null) // OCR ExtractedTiming doesn't have Tamil field
              .morningTimings(destTiming.getMorningTimings())
              .afternoonTimings(destTiming.getAfternoonTimings())
              .nightTimings(destTiming.getNightTimings())
              .build();
          timings.add(timing);
        }
        contribution.setExtractedTimings(timings);
      }

      // Process extracted timings and create bus timing records
      int createdCount = 0;
      int mergedCount = 0;
      int skippedCount = 0;

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
