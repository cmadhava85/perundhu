package com.perundhu.application.dto;

import java.util.List;

/**
 * DTO for multi-bus-stand search response.
 * When user searches with a city name (e.g., "Aruppukottai"),
 * this response includes buses from ALL bus stands in that city.
 */
public record MultiStandSearchResponse(
    // Search query information
    String fromCity,
    String toCity,
    SearchType searchType, // CITY_ONLY, BUS_STAND_SPECIFIC, or WITH_DETAILS

    // Available bus stands for filtering
    List<BusStandDTO> fromBusStands,
    List<BusStandDTO> toBusStands,

    // All buses across all bus stand combinations
    List<BusDTO> buses,

    // Summary statistics
    int totalBuses,
    int busStandCombinations) {
  /**
   * Enum for search type detection
   */
  public enum SearchType {
    CITY_ONLY, // User entered: "Aruppukottai"
    BUS_STAND_SPECIFIC, // User entered: "Aruppukottai New Bus Stand"
    WITH_DETAILS // User selected specific stand from dropdown
  }

  /**
   * Create a simple response for single bus stand search
   */
  public static MultiStandSearchResponse forSingleStand(
      String from,
      String to,
      List<BusDTO> buses) {
    return new MultiStandSearchResponse(
        from,
        to,
        SearchType.BUS_STAND_SPECIFIC,
        List.of(),
        List.of(),
        buses,
        buses.size(),
        1);
  }

  /**
   * Create response for city-level search with multiple bus stands
   */
  public static MultiStandSearchResponse forMultipleStands(
      String fromCity,
      String toCity,
      List<BusStandDTO> fromStands,
      List<BusStandDTO> toStands,
      List<BusDTO> allBuses) {
    int combinations = fromStands.size() * toStands.size();
    return new MultiStandSearchResponse(
        fromCity,
        toCity,
        SearchType.CITY_ONLY,
        fromStands,
        toStands,
        allBuses,
        allBuses.size(),
        combinations);
  }

  /**
   * Get summary message for display
   */
  public String getSummaryMessage() {
    if (searchType == SearchType.CITY_ONLY) {
      return String.format(
          "%d buses found from %d bus stand%s in %s to %d bus stand%s in %s",
          totalBuses,
          fromBusStands.size(),
          fromBusStands.size() > 1 ? "s" : "",
          fromCity,
          toBusStands.size(),
          toBusStands.size() > 1 ? "s" : "",
          toCity);
    }
    return String.format("%d buses found", totalBuses);
  }
}
