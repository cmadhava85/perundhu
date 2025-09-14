package com.perundhu.infrastructure.persistence.jpa;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

/**
 * JPA Repository for Location entities
 */
@Repository
public interface LocationJpaRepository extends JpaRepository<LocationJpaEntity, Long> {

  /**
   * Find location by name (case-insensitive)
   */
  Optional<LocationJpaEntity> findByNameIgnoreCase(String name);

  /**
   * Find locations within a certain distance (approximate using
   * latitude/longitude bounds)
   */
  @Query("SELECT l FROM LocationJpaEntity l WHERE " +
      "l.latitude BETWEEN :minLat AND :maxLat AND " +
      "l.longitude BETWEEN :minLon AND :maxLon")
  List<LocationJpaEntity> findWithinBounds(
      @Param("minLat") Double minLatitude,
      @Param("maxLat") Double maxLatitude,
      @Param("minLon") Double minLongitude,
      @Param("maxLon") Double maxLongitude);

  /**
   * Find locations by partial name match
   */
  @Query("SELECT l FROM LocationJpaEntity l WHERE LOWER(l.name) LIKE LOWER(CONCAT('%', :name, '%'))")
  List<LocationJpaEntity> findByNameContainingIgnoreCase(@Param("name") String name);

  /**
   * Find locations by exact coordinates
   */
  Optional<LocationJpaEntity> findByLatitudeAndLongitude(Double latitude, Double longitude);
}