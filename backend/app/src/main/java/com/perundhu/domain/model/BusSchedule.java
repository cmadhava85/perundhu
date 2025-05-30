package com.perundhu.domain.model;

import java.time.LocalTime;
import java.util.Objects;

public class BusSchedule {
    private final BusScheduleId id;
    private final String busNumber;
    private final Location origin;
    private final Location destination;
    private final LocalTime departureTime;
    private final LocalTime arrivalTime;

    public BusSchedule(BusScheduleId id, String busNumber, Location origin, Location destination,
                      LocalTime departureTime, LocalTime arrivalTime) {
        this.id = id;
        this.busNumber = busNumber;
        this.origin = origin;
        this.destination = destination;
        this.departureTime = departureTime;
        this.arrivalTime = arrivalTime;
    }

    public BusScheduleId getId() {
        return id;
    }

    public String getBusNumber() {
        return busNumber;
    }

    public Location getOrigin() {
        return origin;
    }

    public Location getDestination() {
        return destination;
    }

    public LocalTime getDepartureTime() {
        return departureTime;
    }

    public LocalTime getArrivalTime() {
        return arrivalTime;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        BusSchedule that = (BusSchedule) o;
        return Objects.equals(id, that.id) &&
               Objects.equals(busNumber, that.busNumber) &&
               Objects.equals(origin, that.origin) &&
               Objects.equals(destination, that.destination) &&
               Objects.equals(departureTime, that.departureTime) &&
               Objects.equals(arrivalTime, that.arrivalTime);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, busNumber, origin, destination, departureTime, arrivalTime);
    }

    @Override
    public String toString() {
        return "BusSchedule{" +
                "id=" + id +
                ", busNumber='" + busNumber + '\'' +
                ", origin=" + origin +
                ", destination=" + destination +
                ", departureTime=" + departureTime +
                ", arrivalTime=" + arrivalTime +
                '}';
    }

    public static class BusScheduleId {
        private final Long value;

        public BusScheduleId(Long value) {
            this.value = value;
        }

        public Long getValue() {
            return value;
        }

        @Override
        public boolean equals(Object o) {
            if (this == o) return true;
            if (o == null || getClass() != o.getClass()) return false;
            BusScheduleId that = (BusScheduleId) o;
            return Objects.equals(value, that.value);
        }

        @Override
        public int hashCode() {
            return Objects.hash(value);
        }

        @Override
        public String toString() {
            return value.toString();
        }
    }
}