package com.perundhu.domain.model;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Value;

@AllArgsConstructor
@Getter
@Builder
@EqualsAndHashCode(of = "id")
public class BusLocationHistory {
    
    private final BusLocationHistoryId id;
    private final Bus bus;
    private final Location location;
    private final LocalDateTime timestamp;
    private final Double speed;
    private final Double heading;
    
    @Value
    public static class BusLocationHistoryId {
        UUID value;
        
        public static BusLocationHistoryId generate() {
            return new BusLocationHistoryId(UUID.randomUUID());
        }
    }
    
    public static BusLocationHistory createFrom(Bus bus, Location location, Double speed, Double heading) {
        return BusLocationHistory.builder()
                .id(BusLocationHistoryId.generate())
                .bus(bus)
                .location(location)
                .timestamp(LocalDateTime.now())
                .speed(speed)
                .heading(heading)
                .build();
    }
}