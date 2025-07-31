package com.perundhu.infrastructure.persistence.jpa;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.perundhu.infrastructure.persistence.entity.BusAnalyticsJpaEntity;
import com.perundhu.infrastructure.persistence.entity.LocationJpaEntity;

@Repository("jpaPackageBusAnalyticsJpaRepository")
public interface BusAnalyticsJpaRepository extends JpaRepository<BusAnalyticsJpaEntity, UUID> {

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba WHERE ba.bus.id = :busId AND ba.date = :date")
       Optional<BusAnalyticsJpaEntity> findByBusIdAndDate(@Param("busId") UUID busId,
                     @Param("date") LocalDateTime date);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba WHERE ba.bus.id = :busId")
       List<BusAnalyticsJpaEntity> findByBusId(@Param("busId") UUID busId);

       List<BusAnalyticsJpaEntity> findByDateBetween(LocalDateTime startDate, LocalDateTime endDate);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba WHERE ba.bus.id = :busId AND ba.date BETWEEN :startDate AND :endDate")
       List<BusAnalyticsJpaEntity> findByBusIdAndDateBetween(
                     @Param("busId") UUID busId,
                     @Param("startDate") LocalDateTime startDate,
                     @Param("endDate") LocalDateTime endDate);

       @Modifying
       @Query("DELETE FROM BusAnalyticsJpaEntity ba WHERE ba.date < :dateTime")
       void deleteOlderThan(@Param("dateTime") LocalDateTime dateTime);

       // Methods for analytics API with pagination
       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba " +
                     "WHERE ba.bus.fromLocation = :fromLocation AND ba.bus.toLocation = :toLocation " +
                     "AND ba.bus.id = :busId AND ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                     @Param("fromLocation") LocationJpaEntity fromLocation,
                     @Param("toLocation") LocationJpaEntity toLocation,
                     @Param("busId") Long busId,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime,
                     Pageable pageable);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba " +
                     "WHERE ba.bus.fromLocation = :fromLocation AND ba.bus.toLocation = :toLocation " +
                     "AND ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByFromLocationAndToLocationAndDateTimeBetween(
                     @Param("fromLocation") LocationJpaEntity fromLocation,
                     @Param("toLocation") LocationJpaEntity toLocation,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime,
                     Pageable pageable);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba WHERE ba.bus.id = :busId " +
                     "AND ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByBusIdAndDateTimeBetween(
                     @Param("busId") Long busId,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime,
                     Pageable pageable);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba " +
                     "WHERE ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByDateTimeBetween(
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime,
                     Pageable pageable);

       // Non-paginated queries
       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba " +
                     "WHERE ba.bus.fromLocation = :fromLocation AND ba.bus.toLocation = :toLocation " +
                     "AND ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByFromLocationAndToLocationAndDateTimeBetween(
                     @Param("fromLocation") LocationJpaEntity fromLocation,
                     @Param("toLocation") LocationJpaEntity toLocation,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba WHERE ba.bus.id = :busId " +
                     "AND ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByBusIdAndDateTimeBetween(
                     @Param("busId") Long busId,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);

       @Query("SELECT ba FROM BusAnalyticsJpaEntity ba WHERE ba.date BETWEEN :startDateTime AND :endDateTime")
       List<BusAnalyticsJpaEntity> findByDateTimeBetween(
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);

       // Count queries
       @Query("SELECT COUNT(ba) FROM BusAnalyticsJpaEntity ba " +
                     "WHERE ba.bus.fromLocation = :fromLocation AND ba.bus.toLocation = :toLocation " +
                     "AND ba.bus.id = :busId AND ba.date BETWEEN :startDateTime AND :endDateTime")
       int countByFromLocationAndToLocationAndBusIdAndDateTimeBetween(
                     @Param("fromLocation") LocationJpaEntity fromLocation,
                     @Param("toLocation") LocationJpaEntity toLocation,
                     @Param("busId") Long busId,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);

       @Query("SELECT COUNT(ba) FROM BusAnalyticsJpaEntity ba " +
                     "WHERE ba.bus.fromLocation = :fromLocation AND ba.bus.toLocation = :toLocation " +
                     "AND ba.date BETWEEN :startDateTime AND :endDateTime")
       int countByFromLocationAndToLocationAndDateTimeBetween(
                     @Param("fromLocation") LocationJpaEntity fromLocation,
                     @Param("toLocation") LocationJpaEntity toLocation,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);

       @Query("SELECT COUNT(ba) FROM BusAnalyticsJpaEntity ba WHERE ba.bus.id = :busId " +
                     "AND ba.date BETWEEN :startDateTime AND :endDateTime")
       int countByBusIdAndDateTimeBetween(
                     @Param("busId") Long busId,
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);

       @Query("SELECT COUNT(ba) FROM BusAnalyticsJpaEntity ba WHERE ba.date BETWEEN :startDateTime AND :endDateTime")
       int countByDateTimeBetween(
                     @Param("startDateTime") LocalDateTime startDateTime,
                     @Param("endDateTime") LocalDateTime endDateTime);
}
