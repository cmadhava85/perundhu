package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.LocationValidationService;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.StopRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for processing user-contributed routes and images
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ContributionProcessingService {

    // Using sealed interface for contribution status
    private sealed interface ContributionStatus
            permits ApprovedStatus, RejectedStatus, PendingStatus, FailedStatus, DuplicateStatus {
        String getValue();
    }

    private record ApprovedStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "APPROVED";
        }
    }

    private record RejectedStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "REJECTED";
        }
    }

    private record PendingStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "PENDING";
        }
    }

    private record FailedStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "FAILED";
        }
    }

    private record DuplicateStatus() implements ContributionStatus {
        @Override
        public String getValue() {
            return "DUPLICATE";
        }
    }

    // Record for location validation result
    private record LocationValidationResult(boolean isValid, String message) {
    }

    private final RouteContributionRepository routeContributionRepository;
    private final ImageContributionOutputPort imageContributionPort; // Changed from ImageContributionRepository
    private final BusRepository busRepository;
    private final LocationRepository locationRepository;
    private final StopRepository stopRepository;
    private final LocationValidationService locationValidationService;
    private final NotificationService notificationService;
    private final RouteContributionValidationService validationService;

    /**
     * Scheduled job to process pending route contributions
     */
    @Scheduled(cron = "0 0 * * * *") // Run once every hour
    @Transactional
    public void processRouteContributions() {
        log.info("Starting scheduled processing of route contributions");

        // Process both pending and approved contributions
        var pendingContributions = routeContributionRepository.findByStatus(new PendingStatus().getValue());
        var approvedContributions = routeContributionRepository.findByStatus(new ApprovedStatus().getValue());

        log.info("Found {} pending and {} approved route contributions to process",
                pendingContributions.size(), approvedContributions.size());

        // Process pending contributions (for validation and auto-approval)
        for (var contribution : pendingContributions) {
            try {
                processRouteContribution(contribution);
            } catch (Exception e) {
                log.error("Error processing pending route contribution ID {}: {}",
                        contribution.getId(), e.getMessage(), e);

                updateContributionStatus(
                        contribution,
                        new FailedStatus(),
                        "Processing error: " + e.getMessage());
            }
        }

        // Process approved contributions (for integration into bus database)
        for (var contribution : approvedContributions) {
            try {
                integrateApprovedContribution(contribution);
            } catch (Exception e) {
                log.error("Error integrating approved route contribution ID {}: {}",
                        contribution.getId(), e.getMessage(), e);

                updateContributionStatus(
                        contribution,
                        new FailedStatus(),
                        "Integration error: " + e.getMessage());
            }
        }

        log.info("Completed processing of route contributions");
    }

    /**
     * Scheduled job to process pending image contributions
     */
    @Scheduled(cron = "0 30 * * * *") // Run once every hour at 30 minutes past
    @Transactional
    public void processImageContributions() {
        log.info("Starting scheduled processing of image contributions");

        var pendingContributions = imageContributionPort.findByStatus(new PendingStatus().getValue());

        log.info("Found {} pending image contributions to process", pendingContributions.size());

        for (var contribution : pendingContributions) {
            try {
                processImageContribution(contribution);
            } catch (Exception e) {
                log.error("Error processing image contribution ID {}: {}",
                        contribution.getId(), e.getMessage(), e);

                updateContributionStatus(
                        contribution,
                        new FailedStatus(),
                        "Processing error: " + e.getMessage());
            }
        }

        log.info("Completed processing of image contributions");
    }

    /**
     * Process a single route contribution
     */
    private void processRouteContribution(RouteContribution contribution) {
        log.info("Processing route contribution ID {}", contribution.getId());

        // 1. Validate locations
        var locationValidationResult = validateLocations(contribution);

        if (!locationValidationResult.isValid()) {
            updateContributionStatus(
                    contribution,
                    new RejectedStatus(),
                    locationValidationResult.message());
            notificationService.notifyContributionRejected(contribution);
            return;
        }

        // 2. Check for existing bus routes
        if (busRepository.existsByBusNumberAndFromAndToLocations(
                contribution.getBusNumber(),
                contribution.getFromLocationName(),
                contribution.getToLocationName())) {

            log.info("Route already exists for contribution ID {}", contribution.getId());
            updateContributionStatus(
                    contribution,
                    new DuplicateStatus(),
                    "This bus route already exists in our system.");
            notificationService.notifyContributionRejected(contribution);
            return;
        }

        // 3. Create/get locations
        var fromLocation = getOrCreateLocation(
                contribution.getFromLocationName(),
                contribution.getFromLatitude(),
                contribution.getFromLongitude());

        var toLocation = getOrCreateLocation(
                contribution.getToLocationName(),
                contribution.getToLatitude(),
                contribution.getToLongitude());

        // 4. Validate and parse time fields
        LocalTime departureTime;
        LocalTime arrivalTime;
        try {
            if (contribution.getDepartureTime() == null || contribution.getDepartureTime().trim().isEmpty()) {
                throw new IllegalArgumentException("Departure time is required");
            }
            if (contribution.getArrivalTime() == null || contribution.getArrivalTime().trim().isEmpty()) {
                throw new IllegalArgumentException("Arrival time is required");
            }

            departureTime = LocalTime.parse(contribution.getDepartureTime());
            arrivalTime = LocalTime.parse(contribution.getArrivalTime());
        } catch (Exception e) {
            updateContributionStatus(
                    contribution,
                    new FailedStatus(),
                    "Processing error: " + e.getMessage());
            return;
        }

        // 5. Create new bus
        var newBus = Bus.create(
                new BusId(1L), // Temporary ID, will be replaced by database
                contribution.getBusName(),
                contribution.getBusNumber(),
                fromLocation,
                toLocation,
                departureTime,
                arrivalTime);

        var savedBus = busRepository.save(newBus);

        // 6. Create stops if provided
        processStops(contribution, savedBus);

        // 7. Mark contribution as approved
        updateContributionStatus(
                contribution,
                new ApprovedStatus(),
                "Route successfully added to the system.");

        // 7. Notify user
        notificationService.notifyContributionApproved(contribution);

        log.info("Successfully processed route contribution ID {}", contribution.getId());
    }

    /**
     * Process stops for a contribution
     */
    /**
     * Generate a placeholder bus number from route information
     * Format: GEN-{FROM_PREFIX}-{TO_PREFIX}-{COUNTER}
     * Example: GEN-SIV-VIR-001
     */
    private String generateBusNumberFromRoute(String fromLocation, String toLocation) {
        String fromPrefix = fromLocation.substring(0, Math.min(3, fromLocation.length())).toUpperCase();
        String toPrefix = toLocation.substring(0, Math.min(3, toLocation.length())).toUpperCase();

        // Get count of existing routes to generate unique number
        long count = busRepository.findAll().stream()
                .filter(bus -> bus.getBusNumber().startsWith("GEN-" + fromPrefix + "-" + toPrefix))
                .count();

        return String.format("GEN-%s-%s-%03d", fromPrefix, toPrefix, count + 1);
    }

    private void processStops(RouteContribution contribution, Bus savedBus) {
        if (contribution.getStops() != null && !contribution.getStops().isEmpty()) {
            log.info("Processing {} intermediate stops for bus ID: {}",
                    contribution.getStops().size(), savedBus.id().value());

            // Get existing stops for this bus to avoid duplicates
            List<Stop> existingStops = stopRepository.findByBusId(savedBus.id());

            int stopOrder = 1;
            int createdCount = 0;
            int skippedCount = 0;

            for (var stopContribution : contribution.getStops()) {
                try {
                    // Get or create the location for this stop
                    var stopLocation = getOrCreateLocation(
                            stopContribution.getName(),
                            stopContribution.getLatitude(),
                            stopContribution.getLongitude());

                    // Check if this stop already exists for this bus (by location)
                    boolean stopExists = existingStops.stream()
                            .anyMatch(existing -> existing.location() != null
                                    && existing.location().id() != null
                                    && existing.location().id().equals(stopLocation.id()));

                    if (stopExists) {
                        log.debug("Stop at location '{}' already exists for bus ID: {}, skipping",
                                stopContribution.getName(), savedBus.id().value());
                        skippedCount++;
                        stopOrder++;
                        continue;
                    }

                    // Parse arrival and departure times if provided
                    LocalTime arrivalTime = null;
                    LocalTime departureTime = null;

                    if (stopContribution.getArrivalTime() != null && !stopContribution.getArrivalTime().isBlank()) {
                        try {
                            arrivalTime = LocalTime.parse(stopContribution.getArrivalTime());
                        } catch (Exception e) {
                            log.warn("Could not parse arrival time '{}' for stop {}",
                                    stopContribution.getArrivalTime(), stopContribution.getName());
                        }
                    }

                    if (stopContribution.getDepartureTime() != null && !stopContribution.getDepartureTime().isBlank()) {
                        try {
                            departureTime = LocalTime.parse(stopContribution.getDepartureTime());
                        } catch (Exception e) {
                            log.warn("Could not parse departure time '{}' for stop {}",
                                    stopContribution.getDepartureTime(), stopContribution.getName());
                        }
                    }

                    // Use stop order from contribution or use sequential order
                    int order = stopContribution.getStopOrder() != null ? stopContribution.getStopOrder() : stopOrder;

                    // Create the Stop domain model
                    var stop = Stop.create(
                            null, // ID will be generated by persistence layer
                            stopContribution.getName(),
                            stopLocation,
                            arrivalTime,
                            departureTime,
                            order);

                    // Save the stop with bus association
                    stopRepository.saveWithBus(stop, savedBus.id());

                    log.info("Created stop: {} (order: {}) for bus ID: {}",
                            stopContribution.getName(), order, savedBus.id().value());

                    createdCount++;
                    stopOrder++;
                } catch (Exception e) {
                    log.error("Failed to create stop '{}' for bus ID {}: {}",
                            stopContribution.getName(), savedBus.id().value(), e.getMessage(), e);
                }
            }

            log.info("Processed stops for bus ID {}: {} created, {} skipped (already existed)",
                    savedBus.id().value(), createdCount, skippedCount);
        }
    }

    /**
     * Validate from and to locations
     */
    private LocationValidationResult validateLocations(RouteContribution contribution) {
        // Use isValidLocation for name validation and isValidLocationCoordinates for
        // coordinates
        boolean fromLocationValid = locationValidationService.isValidLocation(contribution.getFromLocationName()) &&
                (contribution.getFromLatitude() == null || contribution.getFromLongitude() == null ||
                        locationValidationService.isValidLocationCoordinates(contribution.getFromLatitude(),
                                contribution.getFromLongitude()));

        boolean toLocationValid = locationValidationService.isValidLocation(contribution.getToLocationName()) &&
                (contribution.getToLatitude() == null || contribution.getToLongitude() == null ||
                        locationValidationService.isValidLocationCoordinates(contribution.getToLatitude(),
                                contribution.getToLongitude()));

        return fromLocationValid && toLocationValid
                ? new LocationValidationResult(true, "Locations are valid")
                : new LocationValidationResult(false,
                        "Location validation failed. Please provide accurate location details.");
    }

    /**
     * Update the status of a route contribution
     */
    private void updateContributionStatus(RouteContribution contribution,
            ContributionStatus status,
            String message) {
        contribution.setStatus(status.getValue());
        contribution.setValidationMessage(message);
        contribution.setProcessedDate(LocalDateTime.now());
        routeContributionRepository.save(contribution);
    }

    /**
     * Update the status of an image contribution
     */
    private void updateContributionStatus(ImageContribution contribution,
            ContributionStatus status,
            String message) {
        contribution.setStatus(status.getValue());
        contribution.setValidationMessage(message);
        contribution.setProcessedDate(LocalDateTime.now());
        imageContributionPort.save(contribution);
    }

    /**
     * Process a single image contribution
     * Note: Image processing with AI is handled by
     * ImageContributionProcessingService.
     * This method just marks contributions for processing by that service.
     */
    private void processImageContribution(ImageContribution contribution) {
        log.info("Processing image contribution ID {} - delegating to ImageContributionProcessingService",
                contribution.getId());

        // Image contributions are now processed asynchronously by
        // ImageContributionProcessingService
        // using Gemini Vision AI. This scheduled job just checks status.
        if (contribution.getExtractedData() != null && !contribution.getExtractedData().isEmpty()) {
            // Data has been extracted by Gemini Vision, mark as processed
            updateContributionStatus(
                    contribution,
                    new ApprovedStatus(),
                    "Image data extracted successfully. Pending integration.");
        } else {
            // Mark for manual entry if AI processing hasn't extracted data yet
            log.info("Image contribution ID {} awaiting AI processing or manual entry", contribution.getId());
        }

        log.info("Completed processing image contribution ID {}", contribution.getId());
    }

    /**
     * Get an existing location or create a new one.
     * This method uses multiple strategies to find existing locations and avoid duplicates:
     * 1. Case-insensitive exact name match
     * 2. Normalized name match (trimmed, standardized case)
     * 3. Nearby coordinates match (if provided)
     * 4. Only creates new location if no match found
     */
    private Location getOrCreateLocation(String name, Double latitude, Double longitude) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Location name cannot be null or empty");
        }
        
        // Normalize the name: trim whitespace and standardize case
        String normalizedName = normalizePlaceName(name);
        
        // Strategy 1: Try exact name match (case-insensitive)
        var existingByName = locationRepository.findByExactName(normalizedName);
        if (existingByName.isPresent()) {
            log.debug("Found existing location by exact name: {} (ID: {})", 
                    normalizedName, existingByName.get().id().value());
            return existingByName.get();
        }
        
        // Strategy 2: Try with original name (case might differ)
        existingByName = locationRepository.findByExactName(name.trim());
        if (existingByName.isPresent()) {
            log.debug("Found existing location by trimmed name: {} (ID: {})", 
                    name.trim(), existingByName.get().id().value());
            return existingByName.get();
        }
        
        // Strategy 3: Try uppercase version (for OCR-extracted names like "SIVAKASI")
        existingByName = locationRepository.findByExactName(name.trim().toUpperCase());
        if (existingByName.isPresent()) {
            log.debug("Found existing location by uppercase name: {} (ID: {})", 
                    name.trim().toUpperCase(), existingByName.get().id().value());
            return existingByName.get();
        }

        // Strategy 4: If lat/long provided, try to find nearby location
        if (latitude != null && longitude != null) {
            var nearbyLocation = locationRepository.findNearbyLocation(latitude, longitude, 0.01); // ~1km radius

            if (nearbyLocation.isPresent()) {
                log.debug("Found existing location by coordinates: {} (ID: {})", 
                        nearbyLocation.get().name(), nearbyLocation.get().id().value());
                return nearbyLocation.get();
            }
        }
        
        // Strategy 5: Search for partial matches to catch variations
        var partialMatches = locationRepository.findByName(normalizedName);
        if (!partialMatches.isEmpty()) {
            // Return the first match (most likely the correct one)
            Location matched = partialMatches.get(0);
            log.debug("Found existing location by partial match: {} (ID: {})", 
                    matched.name(), matched.id().value());
            return matched;
        }

        // No existing location found - create new one with normalized name
        log.info("Creating new location: {} (lat: {}, lon: {})", normalizedName, latitude, longitude);
        var newLocation = Location.withCoordinates(
                null, // ID will be generated
                normalizedName,
                latitude,
                longitude);

        return locationRepository.save(newLocation);
    }
    
    /**
     * Normalize place names to Title Case for consistency.
     * Examples:
     * - "SIVAKASI" -> "Sivakasi"
     * - "  madurai  " -> "Madurai"
     * - "ARUPPUKKOTTAI" -> "Aruppukkottai"
     */
    private String normalizePlaceName(String name) {
        if (name == null || name.trim().isEmpty()) {
            return name;
        }
        
        String trimmed = name.trim();
        
        // If already looks like Title Case, keep it
        if (Character.isUpperCase(trimmed.charAt(0)) && 
            trimmed.length() > 1 && 
            Character.isLowerCase(trimmed.charAt(1))) {
            return trimmed;
        }
        
        // Convert to Title Case
        StringBuilder result = new StringBuilder();
        boolean capitalizeNext = true;
        
        for (char c : trimmed.toCharArray()) {
            if (Character.isWhitespace(c) || c == '-') {
                capitalizeNext = true;
                result.append(c);
            } else if (capitalizeNext) {
                result.append(Character.toUpperCase(c));
                capitalizeNext = false;
            } else {
                result.append(Character.toLowerCase(c));
            }
        }
        
        return result.toString();
    }

    /**
     * Process route contribution asynchronously
     */
    public CompletableFuture<RouteContribution> processRouteContributionAsync(
            Map<String, Object> sanitizedData) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                // Convert Map to RouteContribution object
                RouteContribution contribution = convertMapToRouteContribution(sanitizedData);

                // Generate ID if not provided
                if (contribution.getId() == null || contribution.getId().isEmpty()) {
                    contribution.setId(UUID.randomUUID().toString());
                }

                // Set status and dates
                contribution.setStatus(new PendingStatus().getValue());
                contribution.setSubmissionDate(LocalDateTime.now());

                // Save the contribution to database using the repository
                RouteContribution saved = routeContributionRepository.save(contribution);
                log.info("Route contribution saved successfully to database: {}", saved.getId());

                return saved;
            } catch (Exception e) {
                log.error("Error processing route contribution async: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to process route contribution", e);
            }
        });
    }

    /**
     * Process route contribution synchronously to catch database errors immediately
     */
    public RouteContribution processRouteContributionSync(Map<String, Object> sanitizedData) {
        try {
            // Convert Map to RouteContribution object
            RouteContribution contribution = convertMapToRouteContribution(sanitizedData);

            // Generate ID if not provided
            if (contribution.getId() == null || contribution.getId().isEmpty()) {
                contribution.setId(UUID.randomUUID().toString());
            }

            // Set status and dates
            contribution.setStatus(new PendingStatus().getValue());
            contribution.setSubmissionDate(LocalDateTime.now());

            // Save the contribution to database using the repository
            // This will throw an exception if database constraints are violated
            RouteContribution saved = routeContributionRepository.save(contribution);

            log.info("Route contribution saved successfully to database: {}", saved.getId());

            return saved;
        } catch (Exception e) {
            log.error("Error processing route contribution sync: {}", e.getMessage(), e);
            throw e; // Re-throw to be caught by the controller
        }
    }

    /**
     * Process image contribution with metadata
     */
    public ImageContribution processImageContribution(
            org.springframework.web.multipart.MultipartFile imageFile,
            Map<String, Object> metadata,
            String userId) {

        try {
            // Create ImageContribution object
            ImageContribution contribution = new ImageContribution();
            contribution.setId(UUID.randomUUID().toString());
            contribution.setUserId(userId);
            contribution.setSubmissionDate(LocalDateTime.now());
            contribution.setStatus(new PendingStatus().getValue());

            // Set description from metadata if available
            if (metadata.containsKey("description")) {
                contribution.setDescription((String) metadata.get("description"));
            }

            // Set location from metadata if available
            if (metadata.containsKey("location")) {
                contribution.setLocation((String) metadata.get("location"));
            }

            // Set route name from metadata if available
            if (metadata.containsKey("routeName")) {
                contribution.setRouteName((String) metadata.get("routeName"));
            }

            // Store metadata in additional notes for reference
            contribution.setAdditionalNotes("File: " + imageFile.getOriginalFilename() +
                    ", Size: " + imageFile.getSize() + " bytes");

            // Save the image file (simplified - in production you'd upload to cloud
            // storage)
            String imageUrl = saveImageFile(imageFile, userId);
            contribution.setImageUrl(imageUrl);

            // Save contribution
            ImageContribution saved = imageContributionPort.save(contribution);
            log.info("Image contribution saved: {}", saved.getId());

            return saved;

        } catch (Exception e) {
            log.error("Error processing image contribution", e);
            throw new RuntimeException("Failed to process image contribution", e);
        }
    }

    /**
     * Get user's contributions
     */
    public List<Map<String, Object>> getUserContributions(String userId) {
        List<Map<String, Object>> contributions = new ArrayList<>();

        // Get route contributions
        var routeContributions = routeContributionRepository.findBySubmittedBy(userId);
        routeContributions.forEach(contribution -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", contribution.getId());
            map.put("type", "ROUTE");
            map.put("status", contribution.getStatus());
            map.put("submissionDate", contribution.getSubmissionDate());
            map.put("lastUpdated", contribution.getProcessedDate());
            map.put("busNumber", contribution.getBusNumber());
            map.put("route", contribution.getFromLocationName() + " to " + contribution.getToLocationName());
            contributions.add(map);
        });

        // Get image contributions
        var imageContributions = imageContributionPort.findByUserId(userId);
        imageContributions.forEach(contribution -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", contribution.getId());
            map.put("type", "IMAGE");
            map.put("status", contribution.getStatus());
            map.put("submissionDate", contribution.getSubmissionDate());
            map.put("lastUpdated", contribution.getProcessedDate());
            map.put("description", contribution.getDescription());
            map.put("location", contribution.getLocation());
            contributions.add(map);
        });

        return contributions;
    }

    /**
     * Check for duplicate contributions
     */
    public boolean checkForDuplicateContribution(Map<String, Object> data, String userId) {
        String busNumber = (String) data.get("busNumber");
        String fromLocation = (String) data.get("fromLocationName");
        String toLocation = (String) data.get("toLocationName");
        String departureTime = (String) data.get("departureTime");
        String arrivalTime = (String) data.get("arrivalTime");

        if (busNumber == null || fromLocation == null || toLocation == null) {
            return false;
        }

        // Check if user has already submitted this EXACT route (including timing) in
        // the last 24 hours
        LocalDateTime yesterday = LocalDateTime.now().minusDays(1);

        var recentContributions = routeContributionRepository.findBySubmittedByAndSubmissionDateAfter(userId,
                yesterday);

        return recentContributions.stream().anyMatch(contribution -> busNumber.equals(contribution.getBusNumber()) &&
                fromLocation.equals(contribution.getFromLocationName()) &&
                toLocation.equals(contribution.getToLocationName()) &&
                // Also check timing to allow different schedules for same route
                (departureTime != null && departureTime.equals(contribution.getDepartureTime())) &&
                (arrivalTime != null && arrivalTime.equals(contribution.getArrivalTime())));
    }

    /**
     * Convert Map data to RouteContribution object
     */
    private RouteContribution convertMapToRouteContribution(Map<String, Object> data) {
        log.debug("DEBUG Backend: Converting map data to RouteContribution: {}", data);

        var contribution = new RouteContribution();
        contribution.setBusNumber((String) data.get("busNumber"));
        contribution.setBusName((String) data.get("busName"));

        // Enhanced null-safety for location names
        String fromLocationName = (String) data.get("fromLocationName");
        String toLocationName = (String) data.get("toLocationName");

        // Fallback to other possible field names if primary ones are null/empty
        if (fromLocationName == null || fromLocationName.trim().isEmpty()) {
            fromLocationName = (String) data.get("origin");
        }
        if (toLocationName == null || toLocationName.trim().isEmpty()) {
            toLocationName = (String) data.get("destination");
        }

        // Final fallback to prevent null constraint violations
        if (fromLocationName == null || fromLocationName.trim().isEmpty()) {
            fromLocationName = "Unknown Origin";
            log.warn("DEBUG Backend: Using fallback for null/empty fromLocationName");
        }
        if (toLocationName == null || toLocationName.trim().isEmpty()) {
            toLocationName = "Unknown Destination";
            log.warn("DEBUG Backend: Using fallback for null/empty toLocationName");
        }

        // Set location names (no more legacy fields)
        contribution.setFromLocationName(fromLocationName.trim());
        contribution.setToLocationName(toLocationName.trim());

        log.debug("DEBUG Backend: Final location names - from: '{}', to: '{}'",
                contribution.getFromLocationName(), contribution.getToLocationName());

        // Enhanced coordinate handling with proper type conversion and logging
        if (data.get("fromLatitude") != null) {
            Object fromLatObj = data.get("fromLatitude");
            Double fromLatitude = convertToDouble(fromLatObj, "fromLatitude");
            contribution.setFromLatitude(fromLatitude);
            log.debug("DEBUG Backend: Set fromLatitude = {}", fromLatitude);
        } else {
            log.warn("DEBUG Backend: fromLatitude is null in request data");
        }

        if (data.get("fromLongitude") != null) {
            Object fromLonObj = data.get("fromLongitude");
            Double fromLongitude = convertToDouble(fromLonObj, "fromLongitude");
            contribution.setFromLongitude(fromLongitude);
            log.debug("DEBUG Backend: Set fromLongitude = {}", fromLongitude);
        } else {
            log.warn("DEBUG Backend: fromLongitude is null in request data");
        }

        if (data.get("toLatitude") != null) {
            Object toLatObj = data.get("toLatitude");
            Double toLatitude = convertToDouble(toLatObj, "toLatitude");
            contribution.setToLatitude(toLatitude);
            log.debug("DEBUG Backend: Set toLatitude = {}", toLatitude);
        } else {
            log.warn("DEBUG Backend: toLatitude is null in request data");
        }

        if (data.get("toLongitude") != null) {
            Object toLonObj = data.get("toLongitude");
            Double toLongitude = convertToDouble(toLonObj, "toLongitude");
            contribution.setToLongitude(toLongitude);
            log.debug("DEBUG Backend: Set toLongitude = {}", toLongitude);
        } else {
            log.warn("DEBUG Backend: toLongitude is null in request data");
        }

        contribution.setDepartureTime((String) data.get("departureTime"));
        contribution.setArrivalTime((String) data.get("arrivalTime"));
        contribution.setScheduleInfo((String) data.get("scheduleInfo"));
        contribution.setAdditionalNotes((String) data.get("additionalNotes"));
        contribution.setStatus("PENDING");
        contribution.setSubmissionDate(LocalDateTime.now());

        // Handle submittedBy field - ensure it's never null
        String submittedBy = (String) data.get("submittedBy");
        if (submittedBy == null || submittedBy.trim().isEmpty()) {
            submittedBy = "anonymous";
        }
        contribution.setSubmittedBy(submittedBy);

        // Set user_id field (required by database)
        contribution.setUserId(submittedBy);

        // Log final coordinate values for debugging
        log.info("DEBUG Backend: Final RouteContribution coordinates - from: ({}, {}), to: ({}, {})",
                contribution.getFromLatitude(), contribution.getFromLongitude(),
                contribution.getToLatitude(), contribution.getToLongitude());

        return contribution;
    }

    /**
     * Helper method to safely convert various number types to Double
     */
    private Double convertToDouble(Object value, String fieldName) {
        if (value == null) {
            log.warn("Null value for coordinate field: {}", fieldName);
            return null;
        }

        try {
            if (value instanceof Double) {
                return (Double) value;
            } else if (value instanceof Float) {
                return ((Float) value).doubleValue();
            } else if (value instanceof Integer) {
                return ((Integer) value).doubleValue();
            } else if (value instanceof Long) {
                return ((Long) value).doubleValue();
            } else if (value instanceof String) {
                String strValue = ((String) value).trim();
                if (strValue.isEmpty()) {
                    log.warn("Empty string value for coordinate field: {}", fieldName);
                    return null;
                }
                return Double.parseDouble(strValue);
            } else {
                log.warn("Unexpected type for coordinate field {}: {} (value: {})",
                        fieldName, value.getClass().getSimpleName(), value);
                return Double.parseDouble(value.toString());
            }
        } catch (NumberFormatException e) {
            log.error("Failed to convert {} to Double: {} (value: {})", fieldName, e.getMessage(), value);
            return null;
        }
    }

    /**
     * Save image file (simplified implementation)
     */
    private String saveImageFile(org.springframework.web.multipart.MultipartFile imageFile, String userId) {
        // In a real implementation, this would upload to cloud storage (AWS S3, Google
        // Cloud Storage, etc.)
        // For now, return a placeholder URL
        String fileName = userId + "_" + System.currentTimeMillis() + "_" + imageFile.getOriginalFilename();
        return "/images/contributions/" + fileName;
    }

    /**
     * Get route contributions by status
     * 
     * @param status The status to filter by
     * @return List of route contributions with the given status
     */
    public List<RouteContribution> getRouteContributionsByStatus(String status) {
        return routeContributionRepository.findByStatus(status);
    }

    /**
     * Get a route contribution by ID
     * 
     * @param id The contribution ID
     * @return The route contribution or null if not found
     */
    public RouteContribution getRouteContributionById(String id) {
        return routeContributionRepository.findById(id).orElse(null);
    }

    /**
     * Validate that a route contribution has all required data for integration.
     * Requirements:
     * - Both from and to location names must be present
     * - Both departure and arrival times must be present
     * 
     * @param contribution The contribution to validate
     * @return Validation result with isValid flag and message
     */
    public record IntegrationValidationResult(boolean isValid, String message) {
    }

    /**
     * Result of batch integration operation
     */
    public record BatchIntegrationResult(
            int integratedCount,
            int skippedCount,
            int failedCount,
            List<String> skippedReasons,
            List<String> failedReasons) {
    }

    public IntegrationValidationResult validateForIntegration(RouteContribution contribution) {
        // Check from location
        if (contribution.getFromLocationName() == null || contribution.getFromLocationName().isBlank()) {
            return new IntegrationValidationResult(false, "From location name is required for integration");
        }

        // Check to location
        if (contribution.getToLocationName() == null || contribution.getToLocationName().isBlank()) {
            return new IntegrationValidationResult(false, "To location name is required for integration");
        }

        // Check departure time - REQUIRED
        if (contribution.getDepartureTime() == null || contribution.getDepartureTime().isBlank()) {
            return new IntegrationValidationResult(false, "Departure time is required for integration");
        }

        // Check arrival time - REQUIRED (no estimation)
        if (contribution.getArrivalTime() == null || contribution.getArrivalTime().isBlank()) {
            return new IntegrationValidationResult(false, "Arrival time is required for integration");
        }

        return new IntegrationValidationResult(true, "Valid for integration");
    }

    /**
     * Batch integrate multiple route contributions with performance optimizations.
     * Uses location caching to avoid repeated database lookups.
     * Runs in a single transaction for better performance.
     * 
     * @param contributions List of route contributions to integrate
     * @return BatchIntegrationResult with counts and error details
     */
    @Transactional
    public BatchIntegrationResult integrateApprovedContributionsBatch(List<RouteContribution> contributions) {
        log.info("Starting batch integration of {} route contributions", contributions.size());
        long startTime = System.currentTimeMillis();

        int integratedCount = 0;
        int skippedCount = 0;
        int failedCount = 0;
        List<String> skippedReasons = new ArrayList<>();
        List<String> failedReasons = new ArrayList<>();

        // Location cache to avoid repeated database lookups
        Map<String, Location> locationCache = new HashMap<>();

        for (RouteContribution contribution : contributions) {
            try {
                // Validate first
                IntegrationValidationResult validationResult = validateForIntegration(contribution);
                if (!validationResult.isValid()) {
                    skippedCount++;
                    skippedReasons.add(contribution.getId() + ": " + validationResult.message());
                    contribution.setStatus("PENDING_REVIEW");
                    contribution.setValidationMessage("Cannot integrate: " + validationResult.message());
                    contribution.setProcessedDate(LocalDateTime.now());
                    routeContributionRepository.save(contribution);
                    continue;
                }

                // Integrate with cached locations
                integrateWithCache(contribution, locationCache);
                integratedCount++;

            } catch (Exception e) {
                failedCount++;
                failedReasons.add(contribution.getId() + ": " + e.getMessage());
                log.error("Failed to integrate contribution {}: {}", contribution.getId(), e.getMessage());
            }
        }

        long duration = System.currentTimeMillis() - startTime;
        log.info("Batch integration completed in {}ms: {} integrated, {} skipped, {} failed",
                duration, integratedCount, skippedCount, failedCount);

        return new BatchIntegrationResult(integratedCount, skippedCount, failedCount, skippedReasons, failedReasons);
    }

    /**
     * Integrate a single contribution using a shared location cache for performance
     */
    private void integrateWithCache(RouteContribution contribution, Map<String, Location> locationCache) {
        // Generate bus number if missing
        if (contribution.getBusNumber() == null || contribution.getBusNumber().isBlank()) {
            String generatedBusNumber = generateBusNumberFromRoute(
                    contribution.getFromLocationName(),
                    contribution.getToLocationName());
            contribution.setBusNumber(generatedBusNumber);
        }

        // Get or create locations using cache
        String fromKey = contribution.getFromLocationName().toLowerCase().trim();
        String toKey = contribution.getToLocationName().toLowerCase().trim();

        Location fromLocation = locationCache.computeIfAbsent(fromKey, k -> 
                getOrCreateLocation(contribution.getFromLocationName(),
                        contribution.getFromLatitude(), contribution.getFromLongitude()));

        Location toLocation = locationCache.computeIfAbsent(toKey, k ->
                getOrCreateLocation(contribution.getToLocationName(),
                        contribution.getToLatitude(), contribution.getToLongitude()));

        // Parse times
        LocalTime departureTime = parseTimeFlexible(contribution.getDepartureTime());
        LocalTime arrivalTime = parseTimeFlexible(contribution.getArrivalTime());

        // Check for duplicate (same route + timing)
        List<Bus> routeBuses = busRepository.findBusesBetweenLocations(
                fromLocation.getId().getValue(),
                toLocation.getId().getValue());

        boolean isDuplicate = routeBuses.stream()
                .anyMatch(bus -> bus.getDepartureTime().equals(departureTime)
                        && bus.getArrivalTime().equals(arrivalTime));

        Bus savedBus;
        if (isDuplicate) {
            savedBus = routeBuses.stream()
                    .filter(bus -> bus.getDepartureTime().equals(departureTime)
                            && bus.getArrivalTime().equals(arrivalTime))
                    .findFirst()
                    .orElseThrow();
        } else {
            var newBus = Bus.create(
                    new BusId(1L),
                    contribution.getBusName() != null ? contribution.getBusName() : "Bus Route",
                    contribution.getBusNumber(),
                    fromLocation,
                    toLocation,
                    departureTime,
                    arrivalTime);
            savedBus = busRepository.save(newBus);
        }

        // Process stops with the same cache
        processStopsWithCache(contribution, savedBus, locationCache);

        // Mark as integrated
        contribution.setStatus("INTEGRATED");
        contribution.setValidationMessage(isDuplicate 
                ? "Duplicate timing skipped - already exists" 
                : "Successfully integrated into bus database");
        contribution.setProcessedDate(LocalDateTime.now());
        routeContributionRepository.save(contribution);
    }

    /**
     * Process stops using location cache for better performance
     */
    private void processStopsWithCache(RouteContribution contribution, Bus savedBus, 
            Map<String, Location> locationCache) {
        if (contribution.getStops() == null || contribution.getStops().isEmpty()) {
            return;
        }

        List<Stop> existingStops = stopRepository.findByBusId(savedBus.getId());
        int stopOrder = 1;

        for (var stopContribution : contribution.getStops()) {
            try {
                String stopKey = stopContribution.getName().toLowerCase().trim();
                Location stopLocation = locationCache.computeIfAbsent(stopKey, k ->
                        getOrCreateLocation(stopContribution.getName(),
                                stopContribution.getLatitude(), stopContribution.getLongitude()));

                // Check for duplicate stop
                boolean stopExists = existingStops.stream()
                        .anyMatch(existing -> existing.getLocation() != null
                                && existing.getLocation().getId() != null
                                && existing.getLocation().getId().equals(stopLocation.getId()));

                if (!stopExists) {
                    LocalTime arrivalTime = null;
                    LocalTime departureTime = null;

                    if (stopContribution.getArrivalTime() != null && !stopContribution.getArrivalTime().isBlank()) {
                        try {
                            arrivalTime = parseTimeFlexible(stopContribution.getArrivalTime());
                        } catch (Exception ignored) {}
                    }
                    if (stopContribution.getDepartureTime() != null && !stopContribution.getDepartureTime().isBlank()) {
                        try {
                            departureTime = parseTimeFlexible(stopContribution.getDepartureTime());
                        } catch (Exception ignored) {}
                    }

                    int order = stopOrder;
                    var newStop = Stop.create(
                            null,  // ID will be generated by persistence layer
                            stopContribution.getName(),
                            stopLocation,
                            arrivalTime != null ? arrivalTime : departureTime,
                            departureTime != null ? departureTime : arrivalTime,
                            order);

                    stopRepository.saveWithBus(newStop, savedBus.getId());
                }
                stopOrder++;
            } catch (Exception e) {
                log.warn("Failed to create stop '{}': {}", stopContribution.getName(), e.getMessage());
            }
        }
    }

    /**
     * Integrate an approved contribution into the main bus database.
     * This method requires all mandatory fields to be present:
     * - From location name
     * - To location name
     * - Departure time
     * - Arrival time
     * 
     * If any of these are missing, the integration will be skipped and the
     * contribution
     * will be marked as PENDING_REVIEW for manual data completion.
     */
    public void integrateApprovedContribution(RouteContribution contribution) {
        log.info("Integrating approved route contribution ID {}", contribution.getId());

        // This method is called when we want to move an approved contribution
        // into the main bus database as a permanent route

        try {
            // Validate required data before integration - ALL fields must be present
            IntegrationValidationResult validationResult = validateForIntegration(contribution);
            if (!validationResult.isValid()) {
                log.warn("Skipping integration for contribution ID {} - {}", 
                        contribution.getId(), validationResult.message());
                contribution.setStatus("PENDING_REVIEW");
                contribution.setValidationMessage("Cannot integrate: " + validationResult.message() + 
                        ". Please complete the missing data before approval.");
                contribution.setProcessedDate(LocalDateTime.now());
                routeContributionRepository.save(contribution);
                return;
            }

            // Bus number is optional - generate one if missing
            if (contribution.getBusNumber() == null || contribution.getBusNumber().isBlank()) {
                // Generate placeholder bus number from route (e.g., "SIV-VIR-001")
                String generatedBusNumber = generateBusNumberFromRoute(
                        contribution.getFromLocationName(),
                        contribution.getToLocationName());
                contribution.setBusNumber(generatedBusNumber);
            }

            // 1. Create/get locations
            var fromLocation = getOrCreateLocation(
                    contribution.getFromLocationName(),
                    contribution.getFromLatitude(),
                    contribution.getFromLongitude());

            var toLocation = getOrCreateLocation(
                    contribution.getToLocationName(),
                    contribution.getToLatitude(),
                    contribution.getToLongitude());

            // 2. Parse timing data safely
            LocalTime departureTime;
            LocalTime arrivalTime;

            try {
                // Normalize and parse time formats
                departureTime = parseTimeFlexible(contribution.getDepartureTime());
                arrivalTime = parseTimeFlexible(contribution.getArrivalTime());
            } catch (Exception timeParseError) {
                throw new IllegalArgumentException("Invalid time format. Expected HH:MM or HH:MM:SS. Departure: '"
                        + contribution.getDepartureTime() + "', Arrival: '" + contribution.getArrivalTime() + "'");
            }

            // 3. Check if this exact timing already exists (same route AND timing)
            // Note: For user-contributed routes without bus number, we check by
            // route+timing only
            Optional<Bus> existingBusWithTiming = Optional.empty();

            if (contribution.getBusNumber() != null && !contribution.getBusNumber().startsWith("GEN-")) {
                // Real bus number - check for exact match (bus number + route + timing)
                existingBusWithTiming = busRepository.findByBusNumberAndRoute(
                        contribution.getBusNumber(),
                        fromLocation.getId(),
                        toLocation.getId())
                        .filter(bus -> bus.getDepartureTime().equals(departureTime)
                                && bus.getArrivalTime().equals(arrivalTime));
            } else {
                // Generated bus number - check by route + timing only
                List<Bus> routeBuses = busRepository.findBusesBetweenLocations(
                        fromLocation.getId().getValue(),
                        toLocation.getId().getValue());
                existingBusWithTiming = routeBuses.stream()
                        .filter(bus -> bus.getDepartureTime().equals(departureTime)
                                && bus.getArrivalTime().equals(arrivalTime))
                        .findFirst();
            }

            Bus savedBus;
            if (existingBusWithTiming.isPresent()) {
                // Exact duplicate (same route and timing) - skip
                savedBus = existingBusWithTiming.get();
            } else {
                // Either new route OR same route with different timing - create new entry
                // This allows: Bus 123 Sivakasi→Virudhunagar at 6 AM, 9 AM, 12 PM (3 separate
                // rows)
                var newBus = Bus.create(
                        new BusId(1L), // Temporary ID, will be replaced by database
                        contribution.getBusName() != null ? contribution.getBusName() : "Bus Route",
                        contribution.getBusNumber(),
                        fromLocation,
                        toLocation,
                        departureTime,
                        arrivalTime);

                savedBus = busRepository.save(newBus);
            }

            // 4. Create/update stops if provided
            processStops(contribution, savedBus);

            // 5. Mark contribution as integrated
            String statusMessage = existingBusWithTiming.isPresent()
                    ? "Duplicate timing skipped - already exists in database"
                    : "Successfully integrated into bus database";

            contribution.setStatus("INTEGRATED");
            contribution.setValidationMessage(statusMessage);
            contribution.setProcessedDate(LocalDateTime.now());
            routeContributionRepository.save(contribution);

            log.info("Successfully integrated approved route contribution ID {} into bus database",
                    contribution.getId());

        } catch (Exception e) {
            log.error("Error integrating approved route contribution ID {}: {}",
                    contribution.getId(), e.getMessage(), e);

            // Mark as failed integration
            contribution.setStatus("INTEGRATION_FAILED");
            contribution.setValidationMessage("Failed to integrate: " + e.getMessage());
            contribution.setProcessedDate(LocalDateTime.now());
            routeContributionRepository.save(contribution);

            throw new RuntimeException("Failed to integrate approved contribution", e);
        }
    }

    /**
     * Estimate journey duration between two locations in minutes.
     * Uses typical Tamil Nadu bus travel times based on common routes.
     */
    private int estimateJourneyDuration(String fromLocation, String toLocation) {
        // Normalize location names for matching
        String from = fromLocation.toUpperCase().trim();
        String to = toLocation.toUpperCase().trim();

        // Known route durations (in minutes) based on actual bus travel times
        // Sivakasi hub routes
        if ((from.contains("SIVAKASI") && to.contains("MADURAI")) ||
                (from.contains("MADURAI") && to.contains("SIVAKASI"))) {
            return 120; // 2 hours
        }
        if ((from.contains("SIVAKASI") && to.contains("VIRUDHUNAGAR")) ||
                (from.contains("VIRUDHUNAGAR") && to.contains("SIVAKASI"))) {
            return 45; // 45 minutes
        }
        if ((from.contains("SIVAKASI") && to.contains("SATTUR")) ||
                (from.contains("SATTUR") && to.contains("SIVAKASI"))) {
            return 40; // 40 minutes
        }
        if ((from.contains("SIVAKASI") && to.contains("KOVILPATTI")) ||
                (from.contains("KOVILPATTI") && to.contains("SIVAKASI"))) {
            return 60; // 1 hour
        }
        if ((from.contains("SIVAKASI") && to.contains("ARUPPUKOTTAI")) ||
                (from.contains("ARUPPUKOTTAI") && to.contains("SIVAKASI"))) {
            return 50; // 50 minutes
        }
        if ((from.contains("SIVAKASI") && to.contains("RAJAPALAYAM")) ||
                (from.contains("RAJAPALAYAM") && to.contains("SIVAKASI"))) {
            return 75; // 1 hour 15 min
        }
        if ((from.contains("SIVAKASI") && to.contains("SRIVILLIPUTHUR")) ||
                (from.contains("SRIVILLIPUTHUR") && to.contains("SIVAKASI"))) {
            return 60; // 1 hour
        }
        if ((from.contains("SIVAKASI") && to.contains("TENKASI")) ||
                (from.contains("TENKASI") && to.contains("SIVAKASI"))) {
            return 90; // 1.5 hours
        }
        if ((from.contains("SIVAKASI") && to.contains("TUTICORIN")) ||
                (from.contains("TUTICORIN") && to.contains("SIVAKASI")) ||
                (from.contains("SIVAKASI") && to.contains("THOOTHUKUDI")) ||
                (from.contains("THOOTHUKUDI") && to.contains("SIVAKASI"))) {
            return 90; // 1.5 hours
        }
        if ((from.contains("SIVAKASI") && to.contains("CHENNAI")) ||
                (from.contains("CHENNAI") && to.contains("SIVAKASI"))) {
            return 480; // 8 hours
        }
        if ((from.contains("SIVAKASI") && to.contains("COIMBATORE")) ||
                (from.contains("COIMBATORE") && to.contains("SIVAKASI"))) {
            return 300; // 5 hours
        }
        if ((from.contains("SIVAKASI") && to.contains("TIRUNELVELI")) ||
                (from.contains("TIRUNELVELI") && to.contains("SIVAKASI"))) {
            return 120; // 2 hours
        }
        if ((from.contains("SIVAKASI") && to.contains("DINDIGUL")) ||
                (from.contains("DINDIGUL") && to.contains("SIVAKASI"))) {
            return 150; // 2.5 hours
        }

        // Default: estimate 90 minutes for unknown routes
        log.debug("Using default journey duration for unknown route: {} to {}", fromLocation, toLocation);
        return 90;
    }

    /**
     * Parse time flexibly, handling various formats from OCR/user input:
     * - "HH:MM" (e.g., "06:30")
     * - "H:MM" (e.g., "6:30")
     * - "HH:MM:SS" (e.g., "06:30:00")
     * - "HH.MM" (e.g., "06.30")
     * - "HHMM" (e.g., "0630")
     * 
     * @param timeStr The time string to parse
     * @return Parsed LocalTime
     * @throws IllegalArgumentException if time cannot be parsed
     */
    private LocalTime parseTimeFlexible(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            throw new IllegalArgumentException("Time string cannot be null or empty");
        }

        String normalized = timeStr.trim();

        // Replace period with colon (common OCR mistake)
        normalized = normalized.replace(".", ":");

        // Remove AM/PM if present (assume 24-hour format from Gemini)
        normalized = normalized.toUpperCase()
                .replace(" AM", "")
                .replace(" PM", "")
                .replace("AM", "")
                .replace("PM", "");
        normalized = normalized.trim();

        // Handle HHMM format (e.g., "0630" -> "06:30")
        if (normalized.matches("\\d{4}")) {
            normalized = normalized.substring(0, 2) + ":" + normalized.substring(2);
        }

        // Handle H:MM format (e.g., "6:30" -> "06:30")
        if (normalized.matches("\\d:\\d{2}(:\\d{2})?")) {
            normalized = "0" + normalized;
        }

        // Ensure HH:MM format has seconds
        if (normalized.matches("\\d{2}:\\d{2}")) {
            normalized += ":00";
        }

        try {
            return LocalTime.parse(normalized);
        } catch (Exception e) {
            log.warn("Failed to parse time '{}' (normalized: '{}'): {}", timeStr, normalized, e.getMessage());
            throw new IllegalArgumentException("Cannot parse time: " + timeStr);
        }
    }
}
