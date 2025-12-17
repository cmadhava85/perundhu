package com.perundhu.domain.port;

import java.util.List;
import java.util.Optional;

import com.perundhu.domain.model.BusStand;
import com.perundhu.domain.model.BusStandId;
import com.perundhu.domain.model.LocationId;

/**
 * Repository port for BusStand entity operations.
 * Enables multi-bus-stand search functionality.
 */
public interface BusStandRepository {

  /**
   * Find a bus stand by its ID
   */
  Optional<BusStand> findById(BusStandId id);

  /**
   * Find a bus stand by its ID value
   */
  Optional<BusStand> findById(Long id);

  /**
   * Find all active bus stands
   */
  List<BusStand> findAll();

  /**
   * Find all bus stands for a specific city by city ID
   * This is the core method for multi-bus-stand search
   * 
   * @param cityId The location ID of the city
   * @return List of all bus stands in that city
   */
  List<BusStand> findByCityId(LocationId cityId);

  /**
   * Find all bus stands for a specific city by city name
   * Case-insensitive search
   * 
   * @param cityName The name of the city
   * @return List of all bus stands in that city
   */
  List<BusStand> findByCityName(String cityName);

  /**
   * Find bus stands by partial name match (autocomplete)
   * Searches both bus stand name and aliases
   * 
   * @param searchTerm The search term (minimum 2 characters)
   * @return List of matching bus stands
   */
  List<BusStand> findByNameContaining(String searchTerm);

  /**
   * Find bus stands by exact name
   * 
   * @param busStandName The exact bus stand name
   * @return Optional containing the bus stand if found
   */
  Optional<BusStand> findByExactName(String busStandName);

  /**
   * Find bus stands near a coordinate
   * 
   * @param latitude  The latitude
   * @param longitude The longitude
   * @param radiusKm  The search radius in kilometers
   * @return List of bus stands within the radius
   */
  List<BusStand> findNearby(Double latitude, Double longitude, double radiusKm);

  /**
   * Check if a search term matches a city name (for determining if multi-stand
   * search is needed)
   * 
   * @param searchTerm The search term from user
   * @return true if the term matches a city name with multiple bus stands
   */
  boolean isCityWithMultipleStands(String searchTerm);

  /**
   * Get count of bus stands for a city
   * 
   * @param cityName The city name
   * @return Count of bus stands
   */
  int countByCityName(String cityName);

  /**
   * Save a bus stand
   */
  BusStand save(BusStand busStand);

  /**
   * Delete a bus stand
   */
  void delete(BusStandId id);
}
