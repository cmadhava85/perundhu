package com.perundhu.application.util;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.application.dto.BusDTO;

/**
 * Utility class to detect and tag multi-leg bus journeys
 * 
 * Groups consecutive buses where the destination of one bus matches
 * the origin of the next bus, and tags them with journey metadata
 * so the frontend can display them as a single connected journey.
 * 
 * Example:
 * - Bus 12A: Broadway (62548) → Kilambakkam (62571) 10:45-11:15
 * - Bus 25B: Kilambakkam (62571) → Madurai (671) 12:00-16:30
 * 
 * Output:
 * - Bus 12A: journeyId="broadway_kilambakkam_madurai_12a_25b", legNumber=1, totalLegs=2
 * - Bus 25B: journeyId="broadway_kilambakkam_madurai_12a_25b", legNumber=2, totalLegs=2, intermediateLocationId=62571
 */
public class MultiLegJourneyWrapper {
    
    private static final Logger log = LoggerFactory.getLogger(MultiLegJourneyWrapper.class);
    
    /**
     * Detect and tag multi-leg journeys in a list of buses
     * 
     * @param buses List of buses from search result
     * @param finalDestinationId The user's final destination ID (used to group journeys)
     * @return List of buses with multi-leg metadata added
     */
    public static List<BusDTO> wrapMultiLegJourneys(List<BusDTO> buses, Long finalDestinationId) {
        if (buses == null || buses.isEmpty()) {
            return buses;
        }
        
        List<BusDTO> result = new ArrayList<>(buses);
        Set<Long> processedBusIds = new HashSet<>();
        
        log.debug("Starting multi-leg journey detection for {} buses", buses.size());
        
        // Try to find multi-leg connections
        for (int i = 0; i < result.size(); i++) {
            BusDTO currentBus = result.get(i);
            
            // Skip if already part of a journey
            if (processedBusIds.contains(currentBus.id())) {
                continue;
            }
            
            // Skip if no destination
            if (currentBus.toLocationId() == null) {
                continue;
            }
            
            // Look for buses that start where this one ends
            List<BusDTO> journeyLegs = new ArrayList<>();
            journeyLegs.add(currentBus);
            processedBusIds.add(currentBus.id());
            
            BusDTO lastBus = currentBus;
            
            // Find consecutive connecting buses (up to 3 transfers = 4 total legs)
            for (int legCount = 1; legCount < 4 && lastBus.toLocationId() != null; legCount++) {
                BusDTO nextConnectingBus = findConnectingBus(result, lastBus.toLocationId(), 
                    processedBusIds, legCount + 1);
                
                if (nextConnectingBus == null) {
                    break;
                }
                
                journeyLegs.add(nextConnectingBus);
                processedBusIds.add(nextConnectingBus.id());
                lastBus = nextConnectingBus;
            }
            
            // If we found a multi-leg journey (2+ legs)
            if (journeyLegs.size() > 1) {
                log.debug("Found multi-leg journey with {} legs: {} → {} via {}",
                    journeyLegs.size(),
                    journeyLegs.get(0).fromLocationName(),
                    journeyLegs.get(journeyLegs.size() - 1).toLocationName(),
                    journeyLegs.stream()
                        .skip(1)
                        .map(BusDTO::fromLocationName)
                        .toList());
                
                String journeyId = generateJourneyId(
                    journeyLegs.get(0).fromLocationId(),
                    journeyLegs.get(journeyLegs.size() - 1).toLocationId(),
                    journeyLegs
                );
                
                // Tag all buses in the journey with metadata
                for (int legIdx = 0; legIdx < journeyLegs.size(); legIdx++) {
                    BusDTO leg = journeyLegs.get(legIdx);
                    
                    BusDTO taggedBus = new BusDTO(
                        leg.id(),
                        leg.number(),
                        leg.name(),
                        leg.operator(),
                        leg.type(),
                        leg.departureTime(),
                        leg.arrivalTime(),
                        leg.rating(),
                        leg.features(),
                        leg.fromLocationId(),
                        leg.fromLocationName(),
                        leg.fromLocationNameTranslated(),
                        leg.toLocationId(),
                        leg.toLocationName(),
                        leg.toLocationNameTranslated(),
                        leg.capacity(),
                        leg.active(),
                        // Multi-leg metadata
                        true, // isMultiLegJourney
                        legIdx + 1, // legNumber (1-indexed)
                        journeyLegs.size(), // totalLegs
                        journeyId,
                        leg.fromLocationId(), // intermediateLocationId is the connection point for next leg
                        leg.fromLocationName() // intermediateLocationName
                    );
                    
                    // For all legs except the first, store the intermediate stop ID/name
                    if (legIdx > 0) {
                        taggedBus = new BusDTO(
                            taggedBus.id(),
                            taggedBus.number(),
                            taggedBus.name(),
                            taggedBus.operator(),
                            taggedBus.type(),
                            taggedBus.departureTime(),
                            taggedBus.arrivalTime(),
                            taggedBus.rating(),
                            taggedBus.features(),
                            taggedBus.fromLocationId(),
                            taggedBus.fromLocationName(),
                            taggedBus.fromLocationNameTranslated(),
                            taggedBus.toLocationId(),
                            taggedBus.toLocationName(),
                            taggedBus.toLocationNameTranslated(),
                            taggedBus.capacity(),
                            taggedBus.active(),
                            true, // isMultiLegJourney
                            legIdx + 1, // legNumber
                            journeyLegs.size(), // totalLegs
                            journeyId,
                            journeyLegs.get(legIdx - 1).toLocationId(), // intermediateLocationId = previous leg's destination
                            journeyLegs.get(legIdx - 1).toLocationName() // intermediateLocationName
                        );
                    }
                    
                    // Replace the bus in the result list
                    int originalIndex = result.indexOf(leg);
                    if (originalIndex >= 0) {
                        result.set(originalIndex, taggedBus);
                    }
                }
            }
        }
        
        log.debug("Multi-leg journey detection complete");
        return result;
    }
    
    /**
     * Find a bus that starts where the given bus ends
     * 
     * @param buses All buses to search
     * @param departingFromLocationId Location where next bus should depart from
     * @param excludeBusIds Bus IDs to skip (already processed)
     * @param maxMinutesBetween Maximum minutes between arrival and next departure (flexible)
     * @return The next connecting bus, or null if not found
     */
    private static BusDTO findConnectingBus(List<BusDTO> buses, Long departingFromLocationId,
            Set<Long> excludeBusIds, int legIndex) {
        
        if (departingFromLocationId == null) {
            return null;
        }
        
        // Find buses that depart from the given location
        for (BusDTO bus : buses) {
            if (excludeBusIds.contains(bus.id())) {
                continue;
            }
            
            if (bus.fromLocationId() != null && 
                Objects.equals(bus.fromLocationId(), departingFromLocationId)) {
                return bus;
            }
        }
        
        return null;
    }
    
    /**
     * Generate a journey ID from the origin, destination, and bus numbers
     * 
     * Format: "origin_intermediate1_intermediate2_destination_busNumbers"
     * Example: "broadway_kilambakkam_madurai_12a_25b"
     */
    private static String generateJourneyId(Long originId, Long destinationId, List<BusDTO> legs) {
        StringBuilder sb = new StringBuilder();
        
        // Add origin and intermediate locations
        long currentLoc = originId;
        
        for (BusDTO leg : legs) {
            // Skip legs with null location IDs
            if (leg.fromLocationId() == null || leg.toLocationId() == null) {
                continue;
            }
            
            if (currentLoc != leg.fromLocationId()) {
                // This shouldn't happen in well-formed journeys
                continue;
            }
            
            if (sb.length() == 0) {
                sb.append(sanitizeLocationName(leg.fromLocationName()));
            }
            
            sb.append("_").append(sanitizeLocationName(leg.toLocationName()));
            currentLoc = leg.toLocationId();
        }
        
        // Add bus numbers
        sb.append("_journey");
        for (BusDTO leg : legs) {
            sb.append("_").append(sanitizeLocationName(leg.number()));
        }
        
        return sb.toString().toLowerCase();
    }
    
    /**
     * Sanitize location name for use in journey ID (remove spaces, special chars)
     */
    private static String sanitizeLocationName(String name) {
        if (name == null) {
            return "unknown";
        }
        return name
            .toLowerCase()
            .replaceAll("[^a-z0-9]+", "")
            .substring(0, Math.min(15, name.length())); // Limit length
    }
}
