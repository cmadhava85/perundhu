package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.List;

/**
 * Domain entity representing a bus stop
 */
public class Stop {
    private final StopId id;
    private final String name;
    private final Location location;
    private final LocalTime arrivalTime;
    private final LocalTime departureTime;
    private final int sequence;
    private final List<String> features;

    /**
     * Constructor for Stop entity
     */
    public Stop(StopId id, String name, Location location, LocalTime arrivalTime,
            LocalTime departureTime, int sequence, List<String> features) {
        this.id = id;
        this.name = name;
        this.location = location;
        this.arrivalTime = arrivalTime;
        this.departureTime = departureTime;
        this.sequence = sequence;
        this.features = features;
    }

    /**
     * Get the stop identifier
     */
    public StopId id() {
        return id;
    }

    /**
     * Get the stop name
     */
    public String name() {
        return name;
    }

    /**
     * Get the location of this stop
     */
    public Location location() {
        return location;
    }

    /**
     * Get the scheduled arrival time at this stop
     */
    public LocalTime arrivalTime() {
        return arrivalTime;
    }

    /**
     * Get the scheduled departure time from this stop
     */
    public LocalTime departureTime() {
        return departureTime;
    }

    /**
     * Get the sequence number of this stop in the route
     */
    public int sequence() {
        return sequence;
    }

    /**
     * Get the features of this stop (e.g., "Shelter", "Bench")
     */
    public List<String> features() {
        return features;
    }

    
