package com.perundhu.domain.model;

import java.util.Objects;

/**
 * Domain entity representing a location (city or town)
 */
public class Location {
    private final LocationId id;
    private String name;
    private String nameLocalLanguage;
    private double latitude;
    private double longitude;

    public Location(LocationId id, String name, String nameLocalLanguage, double latitude, double longitude) {
        this.id = id;
        this.name = name;
        this.nameLocalLanguage = nameLocalLanguage;
        this.latitude = latitude;
        this.longitude = longitude;
    }

    public LocationId getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getNameLocalLanguage() {
        return nameLocalLanguage;
    }

    public void setNameLocalLanguage(String nameLocalLanguage) {
        this.nameLocalLanguage = nameLocalLanguage;
    }

    public double getLatitude() {
        return latitude;
    }

    public void setLatitude(double latitude) {
        this.latitude = latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public void setLongitude(double longitude) {
        this.longitude = longitude;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o)
            return true;
        if (o == null || getClass() != o.getClass())
            return false;
        Location location = (Location) o;
        return Objects.equals(id, location.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    @Override
    public String toString() {
        return "Location{" +
                "id=" + id +
                ", name='" + name + '\'' +
                ", nameLocalLanguage='" + nameLocalLanguage + '\'' +
                ", latitude=" + latitude +
                ", longitude=" + longitude +
                '}';
    }

    public static class LocationId {
        private final Long value;

        public LocationId(Long value) {
            this.value = value;
        }

        public Long value() {
            return value;
        }
    }
}
