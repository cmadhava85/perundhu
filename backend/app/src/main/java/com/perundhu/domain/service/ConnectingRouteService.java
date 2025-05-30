package com.perundhu.domain.service;

import java.time.Duration;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;

/**
 * Domain service for finding connecting routes between locations
 */
public class ConnectingRouteService {
    
    // Minimum connection time in minutes
    private static final int MIN_CONNECTION_TIME_MINUTES = 15;
    
    /**
     * Find all connecting routes between two locations
     * 
     * @param buses all available buses
     * @param from the starting location
     * @param to the destination location
     * @return List of bus lists, where each list represents a route
     */
    public List<List<Bus>> findConnectingRoutes(List<Bus> buses, Location from, Location to) {
        List<List<Bus>> results = new ArrayList<>();
        Set<Location> visited = new HashSet<>();
        List<Bus> currentPath = new ArrayList<>();
        
        // Start DFS from the source location
        findRoutesDFS(buses, from, to, visited, currentPath, results);
        
        // Filter out invalid connection times
        return filterInvalidConnectionTimes(results);
    }
    
    /**
     * Filters out routes with invalid connection times
     */
    private List<List<Bus>> filterInvalidConnectionTimes(List<List<Bus>> routes) {
        List<List<Bus>> validRoutes = new ArrayList<>();
        
        for (List<Bus> route : routes) {
            boolean isValid = true;
            
            // Check connection times between consecutive buses
            for (int i = 0; i < route.size() - 1; i++) {
                Bus first = route.get(i);
                Bus second = route.get(i + 1);
                
                LocalTime firstArrival = first.getArrivalTime();
                LocalTime secondDeparture = second.getDepartureTime();
                
                // Calculate minutes between arrival of first bus and departure of second bus
                long minutes = Duration.between(firstArrival, secondDeparture).toMinutes();
                
                // If connection time is less than minimum, mark route as invalid
                if (minutes < MIN_CONNECTION_TIME_MINUTES) {
                    isValid = false;
                    break;
                }
            }
            
            if (isValid) {
                validRoutes.add(route);
            }
        }
        
        return validRoutes;
    }
    
    private void findRoutesDFS(
            List<Bus> buses, 
            Location current, 
            Location destination, 
            Set<Location> visited,
            List<Bus> currentPath,
            List<List<Bus>> results) {
        
        // Mark the current location as visited
        visited.add(current);
        
        // If we reached the destination, add the current path to results
        if (current.equals(destination)) {
            results.add(new ArrayList<>(currentPath));
            visited.remove(current);
            return;
        }
        
        // For each bus that starts from the current location
        for (Bus bus : buses) {
            if (bus.getFromLocation().equals(current) && !visited.contains(bus.getToLocation())) {
                // Add this bus to the current path
                currentPath.add(bus);
                
                // Continue DFS from the bus's destination
                findRoutesDFS(buses, bus.getToLocation(), destination, visited, currentPath, results);
                
                // Backtrack
                currentPath.remove(currentPath.size() - 1);
            }
        }
        
        // Remove the current location from visited when backtracking
        visited.remove(current);
    }
}