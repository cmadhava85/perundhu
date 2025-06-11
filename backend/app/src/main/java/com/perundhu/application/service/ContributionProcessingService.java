package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Qualifier;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.ImageContributionRepository;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;

import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;
import java.time.LocalDateTime;
import java.time.LocalTime;

/**
 * Service for processing user-contributed routes and images
 */
@Service
@Slf4j
public class ContributionProcessingService {
    
    // Using sealed interface for contribution status
    private sealed interface ContributionStatus permits ApprovedStatus, RejectedStatus, PendingStatus, FailedStatus, DuplicateStatus {
        String getValue();
    }
    
    private record ApprovedStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "APPROVED"; }
    }
    
    private record RejectedStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "REJECTED"; }
    }
    
    private record PendingStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "PENDING"; }
    }
    
    private record FailedStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "FAILED"; }
    }
    
    private record DuplicateStatus() implements ContributionStatus {
        @Override
        public String getValue() { return "DUPLICATE"; }
    }
    
    // Record for location validation result
    private record LocationValidationResult(boolean isValid, String message) {}
    
    private final RouteContributionRepository routeContributionRepository;
    private final ImageContributionRepository imageContributionRepository;
    private final BusRepository busRepository;
    private final LocationRepository locationRepository;
    private final StopRepository stopRepository;
    private final OCRService ocrService;
    private final LocationValidationService locationValidationService;
    private final NotificationService notificationService;
    
    public ContributionProcessingService(
            RouteContributionRepository routeContributionRepository,
            ImageContributionRepository imageContributionRepository,
            BusRepository busRepository,
            LocationRepository locationRepository,
            StopRepository stopRepository,
            OCRService ocrService,
            @Qualifier("applicationLocationValidationService") LocationValidationService locationValidationService,
            NotificationService notificationService) {
        this.routeContributionRepository = routeContributionRepository;
        this.imageContributionRepository = imageContributionRepository;
        this.busRepository = busRepository;
        this.locationRepository = locationRepository;
        this.stopRepository = stopRepository;
        this.ocrService = ocrService;
        this.locationValidationService = locationValidationService;
        this.notificationService = notificationService;
    }

    /**
     * Scheduled job to process pending route contributions
     */
    @Scheduled(cron = "0 0 * * * *") // Run once every hour
    @Transactional
    public void processRouteContributions() {
        log.info("Starting scheduled processing of route contributions");
        
        var pendingContributions = 
            routeContributionRepository.findByStatus(new PendingStatus().getValue());
            
        log.info("Found {} pending route contributions to process", pendingContributions.size());
        
        for (var contribution : pendingContributions) {
            try {
                processRouteContribution(contribution);
            } catch (Exception e) {
                log.error("Error processing route contribution ID {}: {}", 
                    contribution.getId(), e.getMessage(), e);
                    
                updateContributionStatus(
                    contribution, 
                    new FailedStatus(),
                    "Processing error: " + e.getMessage()
                );
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
        
        var pendingContributions = 
            imageContributionRepository.findByStatus(new PendingStatus().getValue());
            
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
                    "Processing error: " + e.getMessage()
                );
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
                locationValidationResult.message()
            );
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
                "This bus route already exists in our system."
            );
            notificationService.notifyContributionRejected(contribution);
            return;
        }
        
        // 3. Create/get locations
        var fromLocation = getOrCreateLocation(
            contribution.getFromLocationName(),
            contribution.getFromLatitude(),
            contribution.getFromLongitude()
        );
        
        var toLocation = getOrCreateLocation(
            contribution.getToLocationName(),
            contribution.getToLatitude(),
            contribution.getToLongitude()
        );
        
        // 4. Create new bus
        var newBus = new Bus(
            null, // ID will be assigned by database
            contribution.getBusName(),
            contribution.getBusNumber(),
            fromLocation,
            toLocation,
            // Convert String time (HH:MM) to LocalTime
            LocalTime.parse(contribution.getDepartureTime()),
            LocalTime.parse(contribution.getArrivalTime()),
            50  // Setting a default capacity value, could be extracted from contribution if available
        );
        
        var savedBus = busRepository.save(newBus);
        
        // 5. Create stops if provided
        processStops(contribution, savedBus);
        
        // 6. Mark contribution as approved
        updateContributionStatus(
            contribution,
            new ApprovedStatus(),
            "Route successfully added to the system."
        );
        
        // 7. Notify user
        notificationService.notifyContributionApproved(contribution);
        
        log.info("Successfully processed route contribution ID {}", contribution.getId());
    }
    
    /**
     * Process stops for a contribution
     */
    private void processStops(RouteContribution contribution, Bus savedBus) {
        if (contribution.getStops() != null && !contribution.getStops().isEmpty()) {
            contribution.getStops().forEach(stopContribution -> {
                var stopLocation = getOrCreateLocation(
                    stopContribution.getName(), 
                    stopContribution.getLatitude(), 
                    stopContribution.getLongitude()
                );
                
                var stop = Stop.builder()
                    .name(stopContribution.getName())
                    .bus(savedBus)
                    .location(stopLocation)
                    .arrivalTime(LocalTime.parse(stopContribution.getArrivalTime()))
                    .departureTime(LocalTime.parse(stopContribution.getDepartureTime()))
                    .stopOrder(stopContribution.getStopOrder())
                    .build();
                
                stopRepository.save(stop);
            });
        }
    }
    
    /**
     * Validate from and to locations
     */
    private LocationValidationResult validateLocations(RouteContribution contribution) {
        boolean fromLocationValid = locationValidationService.validateLocation(
            contribution.getFromLocationName(),
            contribution.getFromLatitude(),
            contribution.getFromLongitude()
        );
        
        boolean toLocationValid = locationValidationService.validateLocation(
            contribution.getToLocationName(),
            contribution.getToLatitude(),
            contribution.getToLongitude()
        );
        
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
        imageContributionRepository.save(contribution);
    }
    
    /**
     * Process a single image contribution
     */
    private void processImageContribution(ImageContribution contribution) {
        log.info("Processing image contribution ID {}", contribution.getId());
        
        // 1. Extract text from image using OCR
        var extractedText = ocrService.extractTextFromImage(contribution.getImageUrl());
        
        if (extractedText == null || extractedText.isEmpty()) {
            log.warn("No text could be extracted from image for contribution ID {}", 
                contribution.getId());
            updateContributionStatus(
                contribution,
                new RejectedStatus(),
                "Unable to extract text from the image. Please upload a clearer image."
            );
            notificationService.notifyContributionRejected(contribution);
            return;
        }
        
        // 2. Parse the extracted text to identify bus details
        try {
            var parsedContribution = ocrService.parseScheduleText(extractedText);
            contribution.setExtractedData(parsedContribution.toString());
            
            // 3. Process the parsed contribution like a manual entry
            processRouteContribution(parsedContribution);
            
            // 4. Update image contribution status based on route processing
            updateContributionStatus(
                contribution,
                switch (parsedContribution.getStatus()) {
                    case "APPROVED" -> new ApprovedStatus();
                    case "REJECTED" -> new RejectedStatus();
                    case "DUPLICATE" -> new DuplicateStatus();
                    case "FAILED" -> new FailedStatus();
                    default -> new PendingStatus();
                },
                parsedContribution.getValidationMessage()
            );
            
        } catch (Exception e) {
            log.error("Failed to parse extracted text from image contribution ID {}: {}", 
                contribution.getId(), e.getMessage(), e);
            updateContributionStatus(
                contribution,
                new FailedStatus(),
                "Could not interpret the schedule information. Error: " + e.getMessage()
            );
            notificationService.notifyContributionRejected(contribution);
        }
        
        log.info("Completed processing image contribution ID {}", contribution.getId());
    }
    
    /**
     * Get an existing location or create a new one
     */
    private Location getOrCreateLocation(String name, Double latitude, Double longitude) {
        // First try to find by exact name
        var existingByName = locationRepository.findByExactName(name);
        if (existingByName.isPresent()) {
            return existingByName.get();
        }
        
        // If lat/long provided, try to find nearby location
        if (latitude != null && longitude != null) {
            var nearbyLocation = 
                locationRepository.findNearbyLocation(latitude, longitude, 0.01); // ~1km radius
                
            if (nearbyLocation.isPresent()) {
                return nearbyLocation.get();
            }
        }
        
        // Create new location
        var newLocation = Location.builder()
            .name(name)
            .latitude(latitude)
            .longitude(longitude)
            .build();
        
        return locationRepository.save(newLocation);
    }
}

