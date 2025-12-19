package com.perundhu.application.service;

import java.time.Duration;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Service for detecting duplicate bus routes during contribution and integration.
 * Implements hybrid approach:
 * - Soft check: Customer side - suggests matches before submission
 * - Hard check: Integration side - prevents duplicates during admin approval
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class DuplicateDetectionService {

    private static final int DEFAULT_TIME_WINDOW_MINUTES = 15;

    private final BusRepository busRepository;
    private final LocationRepository locationRepository;
    private final StopRepository stopRepository;

    /**
     * Match types for duplicate detection
     */
    public enum MatchType {
        EXACT_MATCH,              // Same route + same/similar bus number + timing within window
        POSSIBLE_DUPLICATE,       // Same route + timing within window + DIFFERENT bus number
        PASSES_THROUGH,           // Contribution destination is a stop on existing route
        SAME_BUS_DIFFERENT_TIME,  // Same bus number + route but different service time (>15 min)
        NO_MATCH                  // New unique route
    }

    /**
     * Result of duplicate detection check
     */
    public record DuplicateCheckResult(
            MatchType matchType,
            Bus matchedBus,
            String details,
            int confidenceScore  // 0-100, higher = more confident it's a duplicate
    ) {
        public static DuplicateCheckResult noMatch() {
            return new DuplicateCheckResult(MatchType.NO_MATCH, null, "No matching bus found", 0);
        }

        public static DuplicateCheckResult exactMatch(Bus bus, String details, int confidence) {
            return new DuplicateCheckResult(MatchType.EXACT_MATCH, bus, details, confidence);
        }

        public static DuplicateCheckResult possibleDuplicate(Bus bus, String details, int confidence) {
            return new DuplicateCheckResult(MatchType.POSSIBLE_DUPLICATE, bus, details, confidence);
        }

        public static DuplicateCheckResult passesThrough(Bus bus, String details, int confidence) {
            return new DuplicateCheckResult(MatchType.PASSES_THROUGH, bus, details, confidence);
        }

        public static DuplicateCheckResult sameBusDifferentTime(Bus bus, String details) {
            return new DuplicateCheckResult(MatchType.SAME_BUS_DIFFERENT_TIME, bus, details, 30);
        }

        public boolean isDuplicate() {
            return matchType == MatchType.EXACT_MATCH || matchType == MatchType.PASSES_THROUGH;
        }

        public boolean needsReview() {
            return matchType == MatchType.POSSIBLE_DUPLICATE;
        }

        public boolean isNewRoute() {
            return matchType == MatchType.NO_MATCH || matchType == MatchType.SAME_BUS_DIFFERENT_TIME;
        }
    }

    /**
     * Soft check for customer side - returns all potential matches for user to review.
     * Called before contribution submission.
     */
    public List<DuplicateCheckResult> findPotentialDuplicates(
            String fromLocationName,
            String toLocationName,
            String departureTimeStr,
            String busNumber) {

        LocalTime departureTime = parseTime(departureTimeStr);
        
        // Find matching locations
        List<Location> fromLocations = findMatchingLocations(fromLocationName);
        List<Location> toLocations = findMatchingLocations(toLocationName);

        if (fromLocations.isEmpty() || toLocations.isEmpty()) {
            return List.of();
        }

        List<DuplicateCheckResult> results = new java.util.ArrayList<>();

        for (Location fromLoc : fromLocations) {
            for (Location toLoc : toLocations) {
                List<Bus> routeBuses = busRepository.findBusesBetweenLocations(
                        fromLoc.getId().getValue(),
                        toLoc.getId().getValue());

                for (Bus bus : routeBuses) {
                    DuplicateCheckResult result = evaluateMatch(
                            bus, departureTime, busNumber, toLoc.getName());
                    
                    if (result.matchType() != MatchType.NO_MATCH) {
                        results.add(result);
                    }
                }
            }
        }

        // Also check for pass-through routes
        for (Location fromLoc : fromLocations) {
            results.addAll(findPassThroughMatches(fromLoc, toLocationName, departureTime));
        }

        // Sort by confidence score descending
        results.sort((a, b) -> Integer.compare(b.confidenceScore(), a.confidenceScore()));

        return results;
    }

    /**
     * Hard check for integration side - returns the best match to determine action.
     * Called during admin approval/integration.
     */
    public DuplicateCheckResult checkForDuplicate(
            Location fromLocation,
            Location toLocation,
            LocalTime departureTime,
            String busNumber) {

        return checkForDuplicate(fromLocation, toLocation, departureTime, busNumber, 
                DEFAULT_TIME_WINDOW_MINUTES);
    }

    /**
     * Hard check with custom time window
     */
    public DuplicateCheckResult checkForDuplicate(
            Location fromLocation,
            Location toLocation,
            LocalTime departureTime,
            String busNumber,
            int timeWindowMinutes) {

        // 1. Check exact route match
        List<Bus> routeBuses = busRepository.findBusesBetweenLocations(
                fromLocation.getId().getValue(),
                toLocation.getId().getValue());

        DuplicateCheckResult bestMatch = DuplicateCheckResult.noMatch();

        for (Bus bus : routeBuses) {
            DuplicateCheckResult result = evaluateMatch(
                    bus, departureTime, busNumber, toLocation.getName());

            // Keep the highest confidence match
            if (result.confidenceScore() > bestMatch.confidenceScore()) {
                bestMatch = result;
            }
        }

        // If we found an exact match or possible duplicate, return it
        if (bestMatch.matchType() == MatchType.EXACT_MATCH || 
                bestMatch.matchType() == MatchType.POSSIBLE_DUPLICATE) {
            return bestMatch;
        }

        // 2. Check for pass-through routes
        List<DuplicateCheckResult> passThroughMatches = findPassThroughMatches(
                fromLocation, toLocation.getName(), departureTime);

        for (DuplicateCheckResult ptResult : passThroughMatches) {
            if (ptResult.confidenceScore() > bestMatch.confidenceScore()) {
                bestMatch = ptResult;
            }
        }

        // 3. Check if same bus number runs at different time
        if (busNumber != null && !busNumber.isBlank() && !busNumber.startsWith("GEN-")) {
            List<Bus> sameBusNumberBuses = busRepository.findByBusNumber(busNumber);

            for (Bus bus : sameBusNumberBuses) {
                if (bus.getFromLocation() != null &&
                        locationsMatch(bus.getFromLocation().getName(), fromLocation.getName())) {

                    // Same bus, same origin - check if it's a different service time
                    if (departureTime != null && bus.getDepartureTime() != null) {
                        long minutesDiff = Math.abs(
                                Duration.between(bus.getDepartureTime(), departureTime).toMinutes());

                        if (minutesDiff > timeWindowMinutes) {
                            // Different service time - this is a new service entry
                            return DuplicateCheckResult.sameBusDifferentTime(bus,
                                    String.format("Bus %s has another service at %s (this is %s)",
                                            busNumber, bus.getDepartureTime(), departureTime));
                        }
                    }
                }
            }
        }

        return bestMatch;
    }

    /**
     * Evaluate a single bus against contribution data
     */
    private DuplicateCheckResult evaluateMatch(
            Bus bus,
            LocalTime contributionDepartureTime,
            String contributionBusNumber,
            String destinationName) {

        if (bus.getDepartureTime() == null || contributionDepartureTime == null) {
            return DuplicateCheckResult.noMatch();
        }

        long minutesDiff = Math.abs(
                Duration.between(bus.getDepartureTime(), contributionDepartureTime).toMinutes());

        // Not within time window
        if (minutesDiff > DEFAULT_TIME_WINDOW_MINUTES) {
            return DuplicateCheckResult.noMatch();
        }

        // Calculate confidence score
        int confidence = 50; // Base score for route + time match
        confidence += Math.max(0, 25 - (int) minutesDiff); // Up to +25 for closer times

        // Check bus number match
        boolean busNumberMatches = busNumbersMatch(bus.getBusNumber(), contributionBusNumber);
        boolean hasBusNumber = contributionBusNumber != null && !contributionBusNumber.isBlank() 
                && !contributionBusNumber.startsWith("GEN-");

        if (busNumberMatches) {
            confidence += 25; // Same bus number adds confidence
            return DuplicateCheckResult.exactMatch(bus,
                    String.format("Bus %s matches - same route, departure %s (diff: %d min)",
                            bus.getBusNumber(), bus.getDepartureTime(), minutesDiff),
                    confidence);
        } else if (hasBusNumber && bus.getBusNumber() != null && !bus.getBusNumber().startsWith("GEN-")) {
            // Different real bus numbers - possible duplicate, needs review
            return DuplicateCheckResult.possibleDuplicate(bus,
                    String.format("Route matches but different bus number: existing '%s' vs new '%s'",
                            bus.getBusNumber(), contributionBusNumber),
                    confidence);
        } else {
            // One or both don't have real bus numbers - treat as match
            confidence += 10;
            return DuplicateCheckResult.exactMatch(bus,
                    String.format("Route matches, departure %s (diff: %d min)",
                            bus.getDepartureTime(), minutesDiff),
                    confidence);
        }
    }

    /**
     * Find buses that pass through the destination as a stop
     */
    private List<DuplicateCheckResult> findPassThroughMatches(
            Location fromLocation,
            String destinationName,
            LocalTime departureTime) {

        List<DuplicateCheckResult> results = new java.util.ArrayList<>();

        // Find all buses from the same origin
        List<Bus> busesFromOrigin = busRepository.findBusesBetweenLocations(
                fromLocation.getId().getValue(), null);

        // If that method doesn't support null, we need a different approach
        // Let's use findAll and filter, or add a new repository method
        // For now, we'll check stops for buses that start from this location

        List<Bus> allBuses = busRepository.findAll();

        for (Bus bus : allBuses) {
            if (bus.getFromLocation() == null ||
                    !locationsMatch(bus.getFromLocation().getName(), fromLocation.getName())) {
                continue;
            }

            // Skip if it's the exact destination (not pass-through)
            if (bus.getToLocation() != null &&
                    locationsMatch(bus.getToLocation().getName(), destinationName)) {
                continue;
            }

            // Check timing
            if (departureTime != null && bus.getDepartureTime() != null) {
                long minutesDiff = Math.abs(
                        Duration.between(bus.getDepartureTime(), departureTime).toMinutes());

                if (minutesDiff > DEFAULT_TIME_WINDOW_MINUTES) {
                    continue;
                }
            }

            // Check if destination is a stop on this route
            List<Stop> stops = stopRepository.findByBusId(bus.getId().getValue());

            for (Stop stop : stops) {
                if (stop.getLocation() != null &&
                        locationsMatch(stop.getLocation().getName(), destinationName)) {

                    int confidence = 60; // Pass-through match
                    results.add(DuplicateCheckResult.passesThrough(bus,
                            String.format("Bus %s (%s → %s) passes through %s",
                                    bus.getBusNumber(),
                                    bus.getFromLocation().getName(),
                                    bus.getToLocation().getName(),
                                    destinationName),
                            confidence));
                    break;
                }
            }
        }

        return results;
    }

    /**
     * Find locations matching a name (handles aliases)
     */
    private List<Location> findMatchingLocations(String locationName) {
        if (locationName == null || locationName.isBlank()) {
            return List.of();
        }

        // Try exact match first
        List<Location> exactMatches = locationRepository.findByName(locationName);
        if (!exactMatches.isEmpty()) {
            return exactMatches;
        }

        // Try partial matches
        return locationRepository.findByNameContaining(locationName);
    }

    /**
     * Check if two bus numbers match (handles variations like "27D" vs "27-D")
     */
    private boolean busNumbersMatch(String num1, String num2) {
        if (num1 == null || num2 == null) {
            return num1 == null && num2 == null;
        }

        // Normalize: remove spaces, hyphens, convert to uppercase
        String n1 = normalizeBusNumber(num1);
        String n2 = normalizeBusNumber(num2);

        return n1.equals(n2);
    }

    /**
     * Normalize bus number for comparison
     */
    private String normalizeBusNumber(String busNumber) {
        if (busNumber == null) {
            return "";
        }
        return busNumber.toUpperCase()
                .replaceAll("[\\s\\-_.]", "")  // Remove spaces, hyphens, underscores, dots
                .replaceAll("^(MTC|TNSTC|SETC|PRTC)", ""); // Remove common prefixes
    }

    /**
     * Check if two location names match (handles aliases and variations)
     */
    private boolean locationsMatch(String name1, String name2) {
        if (name1 == null || name2 == null) {
            return false;
        }

        String n1 = name1.toUpperCase().trim();
        String n2 = name2.toUpperCase().trim();

        // Exact match
        if (n1.equals(n2)) {
            return true;
        }

        // Common Tamil Nadu location aliases
        Map<String, List<String>> aliases = Map.of(
                "VIRUDHUNAGAR", List.of("VNR", "VIRU", "VIRUDHU", "VIRUDHUNAGAR JUNCTION"),
                "SIVAKASI", List.of("SVK", "SIVA", "SIVAKASI TOWN"),
                "MADURAI", List.of("MDU", "MADURA", "MADURAI JUNCTION"),
                "SATTUR", List.of("STR", "SATHUR"),
                "ARUPPUKOTTAI", List.of("APK", "ARUPPU", "ARUPPUKKOTTAI"),
                "KOVILPATTI", List.of("KVP", "KOVIL", "KOVILPATTI TOWN"),
                "RAJAPALAYAM", List.of("RPM", "RAJA"),
                "SRIVILLIPUTTUR", List.of("SVP", "SRIVILLIPUTHUR"),
                "TIRUNELVELI", List.of("TN", "NELLAI", "TIRUNELVELI JUNCTION"),
                "THOOTHUKUDI", List.of("TUTICORIN", "TUT", "THOOTHUKUDI PORT")
        );

        for (var entry : aliases.entrySet()) {
            String canonical = entry.getKey();
            List<String> aliasList = entry.getValue();

            boolean n1Matches = n1.contains(canonical) || aliasList.stream().anyMatch(n1::contains);
            boolean n2Matches = n2.contains(canonical) || aliasList.stream().anyMatch(n2::contains);

            if (n1Matches && n2Matches) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parse time string flexibly
     */
    private LocalTime parseTime(String timeStr) {
        if (timeStr == null || timeStr.isBlank()) {
            return null;
        }

        try {
            // Try standard formats
            if (timeStr.contains(":")) {
                String[] parts = timeStr.split(":");
                int hour = Integer.parseInt(parts[0].trim());
                int minute = parts.length > 1 ? Integer.parseInt(parts[1].trim()) : 0;
                return LocalTime.of(hour % 24, minute % 60);
            }
            return null;
        } catch (Exception e) {
            log.debug("Failed to parse time '{}': {}", timeStr, e.getMessage());
            return null;
        }
    }
}
