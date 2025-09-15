package com.perundhu.infrastructure.persistence.jpa;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusJpaEntity;
import com.perundhu.infrastructure.persistence.entity.BusLocationHistoryJpaEntity;

@Repository
public interface BusLocationHistoryJpaRepository extends JpaRepository<BusLocationHistoryJpaEntity, UUID> {

  /**
   * Find bus location history by bus entity
   */
  List<BusLocationHistoryJpaEntity> findByBus(BusJpaEntity bus);

  /**
   * Find bus location history by bus ID
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE blh.bus.id = :busId")
  List<BusLocationHistoryJpaEntity> findByBusId(@Param("busId") Long busId);

  /**
   * Find bus location history by bus and time range
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE blh.bus = :bus " +
      "AND blh.timestamp BETWEEN :startTime AND :endTime ORDER BY blh.timestamp")
  List<BusLocationHistoryJpaEntity> findByBusAndTimestampBetween(
      @Param("bus") BusJpaEntity bus,
      @Param("startTime") LocalDateTime startTime,
      @Param("endTime") LocalDateTime endTime);

  /**
   * Find bus location history by bus ID and time range
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE blh.bus.id = :busId " +
      "AND blh.timestamp BETWEEN :startTime AND :endTime ORDER BY blh.timestamp")
  List<BusLocationHistoryJpaEntity> findByBusIdAndTimestampBetween(
      @Param("busId") Long busId,
      @Param("startTime") LocalDateTime startTime,
      @Param("endTime") LocalDateTime endTime);

  /**
   * Find the latest location for a bus
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE blh.bus = :bus " +
      "ORDER BY blh.timestamp DESC")
  List<BusLocationHistoryJpaEntity> findLatestByBus(@Param("bus") BusJpaEntity bus);

  /**
   * Find bus location history near a specific location
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE " +
      "blh.latitude BETWEEN :minLat AND :maxLat " +
      "AND blh.longitude BETWEEN :minLon AND :maxLon")
  List<BusLocationHistoryJpaEntity> findByLocationArea(
      @Param("minLat") double minLat,
      @Param("maxLat") double maxLat,
      @Param("minLon") double minLon,
      @Param("maxLon") double maxLon);

  /**
   * Count location records for a bus
   */
  long countByBus(BusJpaEntity bus);

  /**
   * Delete old location history records before a certain date
   */
  @Query("DELETE FROM BusLocationHistoryJpaEntity blh WHERE blh.timestamp < :cutoffDate")
  void deleteByTimestampBefore(@Param("cutoffDate") LocalDateTime cutoffDate);

  /**
   * Find location history by timestamp range
   */
  List<BusLocationHistoryJpaEntity> findByTimestampBetween(LocalDateTime start, LocalDateTime end);

  /**
   * Find location history by bus and timestamp after
   */
  List<BusLocationHistoryJpaEntity> findByBusAndTimestampAfter(BusJpaEntity bus, LocalDateTime after);

  /**
   * Find the latest location for a bus (single result)
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE blh.bus = :bus " +
      "ORDER BY blh.timestamp DESC")
  Optional<BusLocationHistoryJpaEntity> findTopByBusOrderByTimestampDesc(@Param("bus") BusJpaEntity bus);

  /**
   * Find location history by timestamp after and speed greater than
   */
  List<BusLocationHistoryJpaEntity> findByTimestampAfterAndSpeedGreaterThan(LocalDateTime after, double speed);

  /**
   * Find location history by speed greater than
   */
  List<BusLocationHistoryJpaEntity> findBySpeedGreaterThan(double speedThreshold);

  /**
   * Count location history by bus and timestamp range
   */
  long countByBusAndTimestampBetween(BusJpaEntity bus, LocalDateTime start, LocalDateTime end);

  /**
   * Find latest locations for multiple bus IDs
   */
  @Query("SELECT blh FROM BusLocationHistoryJpaEntity blh WHERE blh.bus.id IN :busIds " +
      "AND blh.timestamp = (SELECT MAX(blh2.timestamp) FROM BusLocationHistoryJpaEntity blh2 " +
      "WHERE blh2.bus.id = blh.bus.id)")
  List<BusLocationHistoryJpaEntity> findLatestLocationsByBusIds(@Param("busIds") List<Long> busIds);
}