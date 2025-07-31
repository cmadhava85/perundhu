package com.perundhu.domain.service;

import java.util.List;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.ConnectingRoute;

/**
 * Domain service interface for finding connecting routes between locations
 */
public interface ConnectingRouteService {

        /**
         * Find all connecting routes between two locations with default max depth
         * 
         * @param buses all available buses
         * @param from  the starting location
         * @param to    the destination location
         * @return List of bus lists, where each list represents a route
         */
        List<List<Bus>> findConnectingRoutes(List<Bus> buses, Location from, Location to);

        /**
         * Find all connecting routes between two locations with specified max depth
         * 
         * @param buses    all available buses
         * @param from     the starting location
         * @param to       the destination location
         * @param maxDepth maximum depth for the search (number of connections)
         * @return List of bus lists, where each list represents a route
         */
        List<List<Bus>> findConnectingRoutes(List<Bus> buses, Location from, Location to, int maxDepth);

        /**
         * Find connecting routes between two locations with default max depth
         * 
         * @param allBuses     List of all available buses
         * @param fromLocation Starting location
         * @param toLocation   Destination location
         * @param languageCode Language code for localization (used for enrichment)
         * @return List of connecting routes
         */
        List<ConnectingRoute> findConnectingRoutesDetailed(
                        List<Bus> allBuses,
                        Location fromLocation,
                        Location toLocation,
                        String languageCode);

        /**
         * Find connecting routes between two locations with specified max depth
         * 
         * @param allBuses     List of all available buses
         * @param fromLocation Starting location
         * @param toLocation   Destination location
         * @param languageCode Language code for localization (used for enrichment)
         * @param maxDepth     Maximum number of bus changes allowed
         * @return List of connecting routes
         */
        List<ConnectingRoute> findConnectingRoutesDetailed(
                        List<Bus> allBuses,
                        Location fromLocation,
                        Location toLocation,
                        String languageCode,
                        Integer maxDepth);
}
