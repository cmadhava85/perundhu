package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.HashMap;
import java.util.Map;

import lombok.Value;
import lombok.Builder;

@Value
@Builder
public class Stop implements Translatable<Stop> {
    // Using ThreadLocal to avoid issues with concurrent requests
    private static final ThreadLocal<Map<Long, Map<Integer, Boolean>>> busStopOrdersThreadLocal = 
        ThreadLocal.withInitial(HashMap::new);
    
    StopId id;
    String name;
    Bus bus;
    Location location;
    LocalTime arrivalTime;
    LocalTime departureTime;
    Integer stopOrder;
    
    @Builder
    public Stop(StopId id, String name, Bus bus, Location location, LocalTime arrivalTime, LocalTime departureTime, Integer stopOrder) {
        // Thread-safe implementation
        Map<Long, Map<Integer, Boolean>> busStopOrders = busStopOrdersThreadLocal.get();
        Long busId = bus.getId().getValue();
        
        busStopOrders.computeIfAbsent(busId, k -> new HashMap<>());
        
        // If we're in a new thread/request or after a reset, this check won't unnecessarily fail
        // Only check within the current operation context
        if (busStopOrders.get(busId).containsKey(stopOrder)) {
            throw new IllegalArgumentException("Stop order " + stopOrder + " already exists for bus " + busId);
        }
        
        this.id = id;
        this.name = name;
        this.bus = bus;
        this.location = location;
        this.arrivalTime = arrivalTime;
        this.departureTime = departureTime;
        this.stopOrder = stopOrder;
        
        // Register this stop order in the thread-local state
        busStopOrders.get(busId).put(stopOrder, true);
    }
    
    /**
     * Reset the stop order tracking (for tests and between transactions)
     */
    public static void resetStopOrders() {
        busStopOrdersThreadLocal.get().clear();
    }
    
    /**
     * Clean up thread local resources when no longer needed
     */
    public static void cleanupThreadLocal() {
        busStopOrdersThreadLocal.remove();
    }
    
    @Override
    public String getEntityType() {
        return "stop";
    }
    
    @Override
    public Long getEntityId() {
        return id.getValue();
    }
    
    @Override
    public String getDefaultValue(String fieldName) {
        if ("name".equals(fieldName)) {
            return name;
        }
        return null;
    }
    
    @Value
    @Builder
    public static class StopId {
        Long value;
        
        public StopId(Long value) {
            this.value = value;
        }
    }
}