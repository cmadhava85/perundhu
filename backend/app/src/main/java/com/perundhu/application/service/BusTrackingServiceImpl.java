package com.perundhu.application.service;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.perundhu.application.dto.BusLocationDTO;
import com.perundhu.application.dto.BusLocationReportDTO;
import com.perundhu.application.dto.RewardPointsDTO;
import com.perundhu.application.dto.RewardPointsDTO.RewardActivityDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.Stop;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.service.RouteValidationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Implementation of the BusTrackingService for crowd-sourced bus tracking
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class BusTrackingServiceImpl implements BusTrackingService {

    private final BusRepository busRepository;
    private final StopRepository stopRepository;
    private final RouteValidationService routeValidationService;
    
    // Cache for holding the current bus locations
    // In a production environment, this would be in a distributed cache or database
    private final Map<Long, BusLocationDTO> currentBusLocations = new ConcurrentHashMap<>();
    
    // Cache for user tracking data and rewards
    // In a production environment, this would be in a distributed cache or database
    private final Map<String, RewardPointsDTO> userRewards = new ConcurrentHashMap<>();
    
    // Track active users per bus
    private final Map<Long, Map<String, LocalDateTime>> activeBusTrackers = new ConcurrentHashMap<>();

    @Override
    public RewardPointsDTO processLocationReport(BusLocationReportDTO report) {
        log.info("Processing location report for bus {}: lat={}, lng={}", 
                report.getBusId(), report.getLatitude(), report.getLongitude());
        
        // Validate the report first to ensure it's on the correct route
        Optional<Bus> bus = busRepository.findById(new Bus.BusId(report.getBusId()));
        
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
                report.getBusId(), k -> new ConcurrentHashMap<>());
        busTrackers.put(report.getUserId(), LocalDateTime.now());
        
        // Calculate and update user rewards
        RewardPointsDTO rewards = calculateRewards(report);
        
        return rewards;
    }

    @Override
    public void processDisembarkation(Long busId, LocalDateTime timestamp) {
        log.info("Processing disembarkation for bus {}", busId);
        
        // In a real implementation, you would:
        // 1. Update the user's tracking status
        // 2. Award any completion bonuses
        // 3. Remove them from active trackers
        
        // For now, just demonstrate the basic implementation
        Map<String, LocalDateTime> busTrackers = activeBusTrackers.get(busId);
        if (busTrackers != null) {
            // Remove trackers that haven't updated in the last 5 minutes
            List<String> inactiveTrackers = busTrackers.entrySet().stream()
                    .filter(entry -> entry.getValue().isBefore(LocalDateTime.now().minusMinutes(5)))
                    .map(Map.Entry::getKey)
                    .collect(Collectors.toList());
            
            inactiveTrackers.forEach(busTrackers::remove);
        }
    }

    @Override
    public BusLocationDTO getCurrentBusLocation(Long busId) {
        return currentBusLocations.getOrDefault(busId, createEmptyLocationResponse(busId));
    }

    @Override
    public List<BusLocationDTO> getBusLocationsOnRoute(Long fromLocationId, Long toLocationId) {
        log.info("Getting bus locations for route: {} to {}", fromLocationId, toLocationId);
        
        List<BusLocationDTO> result = new ArrayList<>();
        
        // Find all buses for this route
        List<Bus> routeBuses = busRepository.findByFromAndToLocation(
                Location.reference(fromLocationId), 
                Location.reference(toLocationId));
        
        // For each bus on this route, get its current location
        for (Bus bus : routeBuses) {
            BusLocationDTO location = currentBusLocations.get(bus.getId().getValue());
            
            if (location != null) {
                result.add(location);
            }
        }
        
        return result;
    }

    @Override
    public RewardPointsDTO getUserRewardPoints(String userId) {
        return userRewards.getOrDefault(userId, createEmptyRewardResponse(userId));
    }
    
    /**
     * Validate that the reported location is along the expected bus route
     * 
     * @param report The location report
     * @param bus The bus entity
     * @return true if the location is valid
     */
    private boolean validateLocationOnRoute(BusLocationReportDTO report, Bus bus) {
        // Get all stops for this bus
        List<Stop> stops = stopRepository.findByBusOrderByStopOrder(bus);
        
        if (stops.isEmpty()) {
            // If no stops, we can't validate the route, assume it's valid
            return true;
        }
        
        // Check if the location is near any stop
        for (Stop stop : stops) {
            if (stop.getLocation() != null) {
                double distance = routeValidationService.calculateDistance(
                    report.getLatitude(),
                    report.getLongitude(),
                    stop.getLocation().getLatitude(),
                    stop.getLocation().getLongitude()
                );
                
                // If within 500 meters of a stop, consider it valid
                if (distance < 0.5) {
                    return true;
                }
            }
        }
        
        // For points between stops, validate against the route corridor
        // This would ideally use a polyline along the route with a buffer
        // For simplicity, we're using a basic implementation here
        return isLocationBetweenStops(report, stops);
    }
    
    /**
     * Rough check if location is between stops along the route
     */
    private boolean isLocationBetweenStops(BusLocationReportDTO report, List<Stop> stops) {
        // Simple implementation that checks if the point is roughly along the route
        // A more sophisticated implementation would use the actual route polyline
        
        // For now, just assume it's valid if we have limited data
        return true;
    }
    
    /**
     * Update the current location of a bus with a new report
     */
    private void updateBusLocation(BusLocationReportDTO report, Bus bus) {
        // Get or create the current location record
        BusLocationDTO location = currentBusLocations.computeIfAbsent(
                report.getBusId(), k -> new BusLocationDTO());
        
        // Update the location data
        location.setBusId(report.getBusId());
        location.setBusName(bus.getName());
        location.setBusNumber(bus.getBusNumber());
        location.setFromLocation(bus.getFromLocation().getName());
        location.setToLocation(bus.getToLocation().getName());
        location.setLatitude(report.getLatitude());
        location.setLongitude(report.getLongitude());
        location.setSpeed(report.getSpeed());
        location.setHeading(report.getHeading());
        location.setTimestamp(report.getTimestamp());
        
        // Update tracker count
        Map<String, LocalDateTime> busTrackers = activeBusTrackers.get(report.getBusId());
        location.setReportCount(busTrackers != null ? busTrackers.size() : 1);
        
        // Calculate confidence score based on number of trackers and accuracy
        int confidenceScore = calculateConfidenceScore(report, busTrackers != null ? busTrackers.size() : 1);
        location.setConfidenceScore(confidenceScore);
        
        // Update next stop information (simplified implementation)
        updateNextStopInfo(location, bus);
    }
    
    /**
     * Calculate the confidence score for a bus location report
     */
    private int calculateConfidenceScore(BusLocationReportDTO report, int reporterCount) {
        // Base score depends on the number of people reporting the same bus
        int baseScore = Math.min(reporterCount * 20, 60);
        
        // Accuracy adjustment (higher accuracy = higher score)
        // accuracy is in meters, lower is better
        int accuracyScore = (int) Math.max(0, 30 - (report.getAccuracy() / 10));
        
        // Speed validity adjustment (buses typically move at normal speeds)
        int speedScore = 10; // Default
        double speedKmh = report.getSpeed() * 3.6; // Convert m/s to km/h
        
        if (speedKmh > 5 && speedKmh < 80) {
            // Normal bus speed range
            speedScore = 10;
        } else if (speedKmh >= 80) {
            // Too fast for a bus
            speedScore = 0;
        } else if (speedKmh <= 5) {
            // Stopped or very slow
            speedScore = 5; // Could be at a stop
        }
        
        return Math.min(100, baseScore + accuracyScore + speedScore);
    }
    
    /**
     * Update the next stop information for a bus location
     */
    private void updateNextStopInfo(BusLocationDTO location, Bus bus) {
        // Get stops for this bus
        List<Stop> stops = stopRepository.findByBusOrderByStopOrder(bus);
        
        if (stops.isEmpty()) {
            return;
        }
        
        // Find the nearest stop
        Optional<Stop> nearestStop = findNearestStop(location.getLatitude(), 
                                                    location.getLongitude(), 
                                                    stops);
        
        if (nearestStop.isPresent()) {
            Stop stop = nearestStop.get();
            location.setLastReportedStopName(stop.getName());
            
            // Find the next stop after this one
            Optional<Stop> nextStop = findNextStop(stop, stops);
            
            if (nextStop.isPresent()) {
                location.setNextStopName(nextStop.get().getName());
                
                // Estimate arrival time (simplified)
                String estimatedArrival = estimateArrivalTime(
                        location, nextStop.get(), stop);
                location.setEstimatedArrivalTime(estimatedArrival);
            }
        }
    }
    
    /**
     * Find the nearest stop to the given coordinates
     */
    private Optional<Stop> findNearestStop(double latitude, double longitude, List<Stop> stops) {
        Stop nearestStop = null;
        double shortestDistance = Double.MAX_VALUE;
        
        for (Stop stop : stops) {
            if (stop.getLocation() != null) {
                double distance = routeValidationService.calculateDistance(
                        latitude, longitude, 
                        stop.getLocation().getLatitude(), 
                        stop.getLocation().getLongitude());
                
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    nearestStop = stop;
                }
            }
        }
        
        return Optional.ofNullable(nearestStop);
    }
    
    /**
     * Find the next stop after the given stop
     */
    private Optional<Stop> findNextStop(Stop currentStop, List<Stop> stops) {
        // Sort stops by their order
        List<Stop> sortedStops = stops.stream()
                .sorted((s1, s2) -> Integer.compare(s1.getStopOrder(), s2.getStopOrder()))
                .collect(Collectors.toList());
        
        // Find the current stop in the sorted list
        for (int i = 0; i < sortedStops.size() - 1; i++) {
            if (sortedStops.get(i).getId().equals(currentStop.getId())) {
                return Optional.of(sortedStops.get(i + 1));
            }
        }
        
        return Optional.empty();
    }
    
    /**
     * Estimate arrival time at the next stop
     */
    private String estimateArrivalTime(BusLocationDTO location, Stop nextStop, Stop currentStop) {
        // Get current speed in km/h
        double speedKmh = location.getSpeed() * 3.6;
        
        // If speed is too low, use average speed of 25 km/h
        if (speedKmh < 5) {
            speedKmh = 25;
        }
        
        // Calculate distance to next stop
        double distanceKm = 0;
        if (nextStop.getLocation() != null && currentStop.getLocation() != null) {
            distanceKm = routeValidationService.calculateDistance(
                    location.getLatitude(), location.getLongitude(),
                    nextStop.getLocation().getLatitude(), nextStop.getLocation().getLongitude());
        } else {
            // Default to scheduled time if we can't calculate
            return nextStop.getArrivalTime().format(DateTimeFormatter.ofPattern("HH:mm"));
        }
        
        // Calculate estimated time in hours
        double timeHours = distanceKm / speedKmh;
        
        // Convert to minutes
        int minutes = (int) Math.ceil(timeHours * 60);
        
        // Get current time and add minutes
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime estimatedTime = now.plusMinutes(minutes);
        
        return estimatedTime.format(DateTimeFormatter.ofPattern("HH:mm"));
    }
    
    /**
     * Calculate and update rewards for a user submitting bus location reports
     */
    private RewardPointsDTO calculateRewards(BusLocationReportDTO report) {
        String userId = report.getUserId();
        
        // Get or create the user's reward record
        RewardPointsDTO rewards = userRewards.computeIfAbsent(
                userId, k -> createEmptyRewardResponse(userId));
        
        // Calculate points for this report
        int pointsForReport = 5;
        
        // Add bonus points for various factors
        if (report.getAccuracy() < 10) {
            // Bonus for high accuracy
            pointsForReport += 2;
        }
        
        // Check if this is a new location (more valuable than repeated reports)
        // In a real implementation, you would check the last reported location
        
        // Update reward totals
        rewards.setCurrentTripPoints(rewards.getCurrentTripPoints() + pointsForReport);
        rewards.setTotalPoints(rewards.getTotalPoints() + pointsForReport);
        rewards.setLifetimePoints(rewards.getLifetimePoints() + pointsForReport);
        
        // Update user rank
        updateUserRank(rewards);
        
        // Add this activity to recent activities
        RewardActivityDTO activity = new RewardActivityDTO();
        activity.setActivityType("BUS_TRACKING");
        activity.setPointsEarned(pointsForReport);
        activity.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        activity.setDescription("Location report for bus " + report.getBusId());
        
        // Add to recent activities (keep only last 10)
        List<RewardActivityDTO> activities = rewards.getRecentActivities();
        if (activities == null) {
            activities = new ArrayList<>();
            rewards.setRecentActivities(activities);
        }
        
        activities.add(0, activity);
        if (activities.size() > 10) {
            activities.remove(activities.size() - 1);
        }
        
        return rewards;
    }
    
    /**
     * Update a user's rank based on their total points
     */
    private void updateUserRank(RewardPointsDTO rewards) {
        int points = rewards.getTotalPoints();
        
        if (points < 100) {
            rewards.setUserRank("Beginner");
        } else if (points < 500) {
            rewards.setUserRank("Regular Traveler");
        } else if (points < 2000) {
            rewards.setUserRank("Frequent Commuter");
        } else if (points < 5000) {
            rewards.setUserRank("Bus Expert");
        } else {
            rewards.setUserRank("Master Navigator");
        }
    }
    
    /**
     * Create an empty bus location response
     */
    private BusLocationDTO createEmptyLocationResponse(Long busId) {
        Optional<Bus> bus = busRepository.findById(new Bus.BusId(busId));
        
        BusLocationDTO dto = new BusLocationDTO();
        dto.setBusId(busId);
        
        if (bus.isPresent()) {
            dto.setBusName(bus.get().getName());
            dto.setBusNumber(bus.get().getBusNumber());
            dto.setFromLocation(bus.get().getFromLocation().getName());
            dto.setToLocation(bus.get().getToLocation().getName());
        }
        
        dto.setConfidenceScore(0);
        dto.setReportCount(0);
        
        return dto;
    }
    
    /**
     * Create an empty reward points response
     */
    private RewardPointsDTO createEmptyRewardResponse(String userId) {
        RewardPointsDTO dto = new RewardPointsDTO();
        dto.setUserId(userId);
        dto.setTotalPoints(0);
        dto.setCurrentTripPoints(0);
        dto.setLifetimePoints(0);
        dto.setUserRank("Beginner");
        dto.setLeaderboardPosition(0);
        dto.setRecentActivities(new ArrayList<>());
        return dto;
    }
    
    /**
     * Create an error reward response
     */
    private RewardPointsDTO createErrorRewardResponse(String userId, String errorMessage) {
        RewardPointsDTO dto = createEmptyRewardResponse(userId);
        
        RewardActivityDTO activity = new RewardActivityDTO();
        activity.setActivityType("ERROR");
        activity.setPointsEarned(0);
        activity.setTimestamp(LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME));
        activity.setDescription(errorMessage);
        
        List<RewardActivityDTO> activities = new ArrayList<>();
        activities.add(activity);
        dto.setRecentActivities(activities);
        
        return dto;
    }
}