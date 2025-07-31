package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.service.RouteValidationService;

/**
 * Implementation of the BusTrackingService for crowd-sourced bus tracking
 * Updated to use Java 17 record-based ID types
 */
@Service
public class BusTrackingServiceImpl implements BusTrackingService {

    // Constants to avoid string duplication
    private static final String DEFAULT_USER_RANK = "BEGINNER";
    private static final int EARTH_RADIUS_KM = 6371;
    private static final int TRACKER_INACTIVE_MINUTES = 5;

    private static final Logger log = LoggerFactory.getLogger(BusTrackingServiceImpl.class);

    private final BusRepository busRepository;
    private final StopRepository stopRepository;
    private final RouteValidationService routeValidationService;

    /**
     * Constructor for dependency injection
     */
    public BusTrackingServiceImpl(
            BusRepository busRepository,
            StopRepository stopRepository,
            RouteValidationService routeValidationService) {
        this.busRepository = busRepository;
        this.stopRepository = stopRepository;
        this.routeValidationService = routeValidationService;
    }

    // Cache for holding the current bus locations - updated to use BusId
    private final Map<BusId, BusLocationDTO> currentBusLocations = new ConcurrentHashMap<>();

    // Cache for user tracking data and rewards
    private final Map<String, RewardPointsDTO> userRewards = new ConcurrentHashMap<>();

    // Track active users per bus - updated to use BusId
    private final Map<BusId, Map<String, LocalDateTime>> activeBusTrackers = new ConcurrentHashMap<>();

    // Cache for bus location history
    private final Map<BusId, List<BusLocationDTO>> busLocationHistory = new ConcurrentHashMap<>();

    @Override
    public RewardPointsDTO processLocationReport(BusLocationReportDTO report) {
        log.info("Processing location report for bus {}: lat={}, lng={}",
                report.getBusId(), report.getLatitude(), report.getLongitude());

        // Validate the report first to ensure it's on the correct route
        BusId busId = new BusId(report.getBusId());
        Optional<Bus> bus = busRepository.findById(busId);

        if (bus.isEmpty()) {
            log.warn("Report for unknown bus ID: {}", report.getBusId());
            return createErrorRewardResponse(report.getUserId(), "Unknown bus ID");
        }

        // Check if the reported location is along the expected route
        boolean isOnRoute = validateLocationOnRoute(report, bus.get());

        if (!isOnRoute) {
            log.warn("Reported location is not on the expected route for bus {}", report.getBusId());
            return createErrorRewardResponse(report.getUserId(), "Location not on route");
        }

        // Update the current bus location with the new report
        updateBusLocation(report, bus.get());

        // Update the active tracker record for this user
        Map<String, LocalDateTime> busTrackers = activeBusTrackers.computeIfAbsent(
                busId, k -> new ConcurrentHashMap<>());
        busTrackers.put(report.getUserId(), LocalDateTime.now());

        // Calculate and update user rewards - directly return the result
        return calculateRewards(report);
    }

    @Override
    public void processDisembarkation(Long busId, LocalDateTime timestamp) {
        BusId busIdRecord = new BusId(busId);
        log.info("Processing disembarkation for bus {}", busId);

        Map<String, LocalDateTime> busTrackers = activeBusTrackers.get(busIdRecord);
        if (busTrackers != null) {
            // Remove trackers that haven't updated in the last TRACKER_INACTIVE_MINUTES
            List<String> inactiveTrackers = busTrackers.entrySet().stream()
                    .filter(entry -> entry.getValue()
                            .isBefore(LocalDateTime.now().minusMinutes(TRACKER_INACTIVE_MINUTES)))
                    .map(Map.Entry::getKey)
                    .toList();

            inactiveTrackers.forEach(busTrackers::remove);
        }
    }

    @Override
    public BusLocationDTO getCurrentBusLocation(Long busId) {
        BusId busIdRecord = new BusId(busId);
        return currentBusLocations.getOrDefault(busIdRecord, createEmptyLocationResponse());
    }

    @Override
    public List<BusLocationDTO> getBusLocationsOnRoute(Long fromLocationId, Long toLocationId) {
        log.info("Getting bus locations for route: {} to {}", fromLocationId, toLocationId);

        List<BusLocationDTO> result = new ArrayList<>();

        // Find all buses for this route using proper Location.LocationId constructor
        List<Bus> routeBuses = busRepository.findByFromAndToLocation(
                new Location(new Location.LocationId(fromLocationId), null, null, null),
                new Location(new Location.LocationId(toLocationId), null, null, null));

        // For each bus on this route, get its current location
        for (Bus bus : routeBuses) {
            BusLocationDTO location = currentBusLocations.get(bus.id());

            if (location != null) {
                result.add(location);
            }
        }

        return result;
    }

    @Override
    public Map<Long, BusLocationDTO> getActiveBusLocations() {
        log.info("Getting all active bus locations");

        // Convert BusId keys to Long keys to match interface signature
        Map<Long, BusLocationDTO> result = new HashMap<>();
        for (Map.Entry<BusId, BusLocationDTO> entry : currentBusLocations.entrySet()) {
            result.put(entry.getKey().value(), entry.getValue());
        }
        return result;
    }

    @Override
    public Map<String, Object> getEstimatedArrival(Long busId, Long stopId) {
        log.info("Getting estimated arrival for bus {} at stop {}", busId, stopId);

        Map<String, Object> result = new HashMap<>();

        // Get current bus location
        BusLocationDTO location = getCurrentBusLocation(busId);
        if (location == null || location.timestamp() == null) {
            result.put("error", "Bus location not available");
            return result;
        }

        // Get stop info
        Optional<Stop> stopOpt = stopRepository.findById(new Stop.StopId(stopId));
        if (stopOpt.isEmpty()) {
            result.put("error", "Stop not found");
            return result;
        }

        Stop stop = stopOpt.get();

        // Stub implementation - return dummy data
        result.put("busId", busId);
        result.put("stopId", stopId);
        result.put("stopName", stop.getName());
        result.put("estimatedArrival", LocalDateTime.now().plusMinutes(15).toString());
        result.put("confidence", 70);

        return result;
    }

    @Override
    public RewardPointsDTO getUserRewardPoints(String userId) {
        log.info("Getting reward points for user: {}", userId);
        return userRewards.getOrDefault(userId,
                new RewardPointsDTO(userId, 0, 0, 0, DEFAULT_USER_RANK, 0, new ArrayList<>()));
    }

    @Override
    public List<BusLocationDTO> getBusLocationHistory(Long busId, LocalDateTime since) {
        log.info("Getting location history for bus {} since {}", busId, since);

        BusId busIdRecord = new BusId(busId);
        List<BusLocationDTO> history = busLocationHistory.getOrDefault(busIdRecord, new ArrayList<>());

        // Filter history by timestamp if 'since' parameter is provided
        if (since != null) {
            return history.stream()
                    .filter(location -> {
                        try {
                            LocalDateTime locationTime = LocalDateTime.parse(location.timestamp());
                            return locationTime.isAfter(since);
                        } catch (Exception e) {
                            log.warn("Error parsing timestamp for location: {}", location.timestamp());
                            return false;
                        }
                    })
                    .toList();
        }

        return new ArrayList<>(history); // Return copy to avoid external modification
    }

    @Override
    public Stop predictNextStop(Long busId) {
        log.info("Predicting next stop for bus {}", busId);

        try {
            // Get current bus location
            BusLocationDTO currentLocation = getCurrentBusLocation(busId);
            if (currentLocation == null) {
                log.warn("No current location available for bus {}", busId);
                return null;
            }

            // Get the bus entity to access its route information
            BusId busIdRecord = new BusId(busId);
            Optional<Bus> busOpt = busRepository.findById(busIdRecord);
            if (busOpt.isEmpty()) {
                log.warn("Bus not found: {}", busId);
                return null;
            }

            Bus bus = busOpt.get();

            // Get all stops for this bus
            List<Stop> busStops = stopRepository.findByBusOrderByStopOrder(bus);
            if (busStops.isEmpty()) {
                log.warn("No stops found for bus {}", busId);
                return null;
            }

            // Find the closest stop to the current location
            Stop closestStop = null;
            double minDistance = Double.MAX_VALUE;

            for (Stop stop : busStops) {
                if (stop.getLocation() != null &&
                        stop.getLocation().latitude() != null &&
                        stop.getLocation().longitude() != null) {

                    double distance = calculateDistance(
                            currentLocation.latitude(),
                            currentLocation.longitude(),
                            stop.getLocation().latitude(),
                            stop.getLocation().longitude());

                    if (distance < minDistance) {
                        minDistance = distance;
                        closestStop = stop;
                    }
                }
            }

            // If we found a closest stop, predict the next one
            if (closestStop != null && closestStop.getStopOrder() != null) {
                int nextStopOrder = closestStop.getStopOrder() + 1;

                // Find the stop with the next order
                return busStops.stream()
                        .filter(stop -> stop.getStopOrder() != null && stop.getStopOrder().equals(nextStopOrder))
                        .findFirst()
                        .orElse(null); // Return null if no next stop found (end of route)
            }

            return null;

        } catch (Exception e) {
            log.error("Error predicting next stop for bus {}: {}", busId, e.getMessage(), e);
            return null;
        }
    }

    /**
     * Calculate distance between two points using Haversine formula
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                        * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c; // Distance in kilometers
    }

    /**
     * Validates if the reported location is on the expected route for the bus
     */
    private boolean validateLocationOnRoute(BusLocationReportDTO report, Bus bus) {
        // Simple validation - check if the location is within a reasonable distance
        // from the route
        // In a real implementation, this would use proper route geometry validation
        try {
            double reportLat = report.latitude();
            double reportLng = report.longitude();

            // Check if location is within reasonable bounds (basic validation)
            if (reportLat < -90 || reportLat > 90 || reportLng < -180 || reportLng > 180) {
                return false;
            }

            // For now, always return true for valid coordinates
            // TODO: Implement proper route validation using RouteValidationService
            return true;
        } catch (Exception e) {
            log.warn("Error validating location on route: {}", e.getMessage());
            return false;
        }
    }

    /**
     * Update the bus location with a new report
     */
    private void updateBusLocation(BusLocationReportDTO report, Bus bus) {
        BusLocationDTO location = BusLocationDTO.builder()
                .busId(bus.id().value())
                .busName(bus.name())
                .latitude(report.latitude())
                .longitude(report.longitude())
                .speed(report.speed())
                .heading(report.heading())
                .accuracy(report.accuracy())
                .timestamp(report.timestamp()) // Use String timestamp from report
                .build();

        // Create standalone BusId from the bus's ID value to match map key type
        BusId mapKey = new BusId(bus.id().value());
        currentBusLocations.put(mapKey, location);

        // Update bus location history
        busLocationHistory.computeIfAbsent(mapKey, k -> new ArrayList<>()).add(location);
    }

    /**
     * Calculate rewards for a user's location report
     */
    private RewardPointsDTO calculateRewards(BusLocationReportDTO report) {
        // Base points for location report
        int basePoints = 10;

        // Bonus points for accuracy and timing
        int bonusPoints = calculateBonusPoints(report);

        int totalPoints = basePoints + bonusPoints;

        // Update user's total rewards
        String userId = report.getUserId();
        RewardPointsDTO currentRewards = userRewards.getOrDefault(userId,
                new RewardPointsDTO(userId, 0, 0, 0, DEFAULT_USER_RANK, 0, new ArrayList<>()));

        // Create new reward activity using record constructor
        RewardPointsDTO.RewardActivityDTO activity = new RewardPointsDTO.RewardActivityDTO(
                "LOCATION_REPORT",
                totalPoints,
                LocalDateTime.now().toString(),
                "Bus location report for bus " + report.getBusId());

        // Add activity to the list
        List<RewardPointsDTO.RewardActivityDTO> activities = new ArrayList<>(currentRewards.recentActivities());
        activities.add(activity);

        // Create updated rewards using record constructor
        RewardPointsDTO updatedRewards = new RewardPointsDTO(
                userId,
                currentRewards.totalPoints() + totalPoints,
                currentRewards.currentTripPoints() + totalPoints,
                currentRewards.lifetimePoints() + totalPoints,
                currentRewards.userRank(),
                currentRewards.leaderboardPosition(),
                activities);

        userRewards.put(userId, updatedRewards);

        return updatedRewards;
    }

    /**
     * Calculate bonus points based on report quality
     */
    private int calculateBonusPoints(BusLocationReportDTO report) {
        int bonus = 0;

        // High accuracy bonus (accuracy is a primitive double, so no null check needed)
        if (report.accuracy() < 10.0) {
            bonus += 5;
        }

        // Speed data bonus (speed is a primitive double, so no null check needed)
        if (report.speed() > 0) {
            bonus += 3;
        }

        // Heading data bonus (heading is a primitive double, so no null check needed)
        // Valid heading range is 0-360 degrees
        if (report.heading() >= 0 && report.heading() <= 360) {
            bonus += 2;
        }

        return bonus;
    }

    /**
     * Create an error reward response
     */
    private RewardPointsDTO createErrorRewardResponse(String userId, String errorMessage) {
        return new RewardPointsDTO(
                userId,
                0, // totalPoints
                0, // currentTripPoints
                0, // lifetimePoints
                DEFAULT_USER_RANK, // userRank
                0, // leaderboardPosition
                List.of(
                        new RewardPointsDTO.RewardActivityDTO(
                                "ERROR",
                                0,
                                LocalDateTime.now().toString(),
                                "Error: " + errorMessage)));
    }

    /**
     * Create an empty location response
     */
    private BusLocationDTO createEmptyLocationResponse() {
        return BusLocationDTO.builder()
                .busId(0L)
                .busName("Unknown")
                .latitude(0.0)
                .longitude(0.0)
                .timestamp(LocalDateTime.now().toString()) // Convert to String
                .build();
    }
}
