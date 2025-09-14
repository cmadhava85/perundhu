package com.perundhu.domain.model;

import java.util.List;

/**
 * Domain entity representing a bus in the transit system
 */
public class Bus {
    private final BusId id;
    private final String number;
    private final String name;
    private final String operator;
    private final String type;
    private final List<String> features;

    /**
     * Constructor for Bus entity
     */
    public Bus(BusId id, String number, String name, String operator, String type, List<String> features) {
        this.id = id;
        this.number = number;
        this.name = name;
        this.operator = operator;
        this.type = type;
        this.features = features;
    }

    /**
     * Get the bus identifier
     */
    public BusId id() {
        return id;
    }

    /**
     * Get the bus number (route number)
     */
    public String number() {
        return number;
    }

    /**
     * Get the bus name (route name)
     */
    public String name() {
        return name;
    }

    /**
     * Get the bus operator (e.g., MTC, SETC)
     */
    public String operator() {
        return operator;
    }

    /**
     * Get the bus type (e.g., "Express", "Ordinary")
     */
    public String type() {
        return type;
    }

    /**
     * Get the features of this bus
     */
    public List<String> features() {
        return features;
    }
}
