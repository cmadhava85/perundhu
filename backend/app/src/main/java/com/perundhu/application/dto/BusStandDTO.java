package com.perundhu.application.dto;

import java.util.List;

import com.perundhu.domain.model.BusStand;
import com.perundhu.domain.model.BusStandType;

/**
 * DTO for bus stand information.
 * Used in multi-bus-stand search responses.
 */
public record BusStandDTO(
    Long id,
    String busStandName,
    Long cityId,
    String cityName,
    Double latitude,
    Double longitude,
    String busStandType,
    List<String> facilities,
    String address,
    int busCount // Number of buses departing from this stand
) {
  /**
   * Create DTO from domain model
   */
  public static BusStandDTO fromDomain(BusStand busStand) {
    return new BusStandDTO(
        busStand.id() != null ? busStand.id().value() : null,
        busStand.busStandName(),
        busStand.cityId() != null ? busStand.cityId().value() : null,
        busStand.cityName(),
        busStand.latitude(),
        busStand.longitude(),
        busStand.busStandType() != null ? busStand.busStandType().name() : "TNSTC",
        busStand.getFacilities(),
        busStand.address(),
        0 // Bus count will be set externally
    );
  }

  /**
   * Create DTO with bus count
   */
  public static BusStandDTO fromDomainWithCount(BusStand busStand, int busCount) {
    return new BusStandDTO(
        busStand.id() != null ? busStand.id().value() : null,
        busStand.busStandName(),
        busStand.cityId() != null ? busStand.cityId().value() : null,
        busStand.cityName(),
        busStand.latitude(),
        busStand.longitude(),
        busStand.busStandType() != null ? busStand.busStandType().name() : "TNSTC",
        busStand.getFacilities(),
        busStand.address(),
        busCount);
  }

  /**
   * Create a simple DTO with just the essential fields
   */
  public static BusStandDTO simple(Long id, String name, String cityName) {
    return new BusStandDTO(
        id,
        name,
        null,
        cityName,
        null,
        null,
        "TNSTC",
        List.of(),
        null,
        0);
  }
}
