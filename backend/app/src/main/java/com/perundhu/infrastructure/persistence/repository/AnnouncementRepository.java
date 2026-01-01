package com.perundhu.infrastructure.persistence.repository;

import com.perundhu.infrastructure.persistence.entity.AnnouncementJpaEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repository for announcement persistence
 */
@Repository
public interface AnnouncementRepository extends JpaRepository<AnnouncementJpaEntity, Long> {

    /**
     * Find announcement by unique ID
     */
    Optional<AnnouncementJpaEntity> findByUniqueId(String uniqueId);

    /**
     * Get active announcements that are within their schedule window
     */
    @Query("SELECT a FROM AnnouncementJpaEntity a WHERE " +
           "a.isActive = true AND " +
           "a.status = 'PUBLISHED' AND " +
           "(a.startsAt IS NULL OR a.startsAt <= :now) AND " +
           "(a.expiresAt IS NULL OR a.expiresAt >= :now) " +
           "ORDER BY a.priority DESC, a.createdAt DESC")
    List<AnnouncementJpaEntity> findActiveAnnouncements(@Param("now") LocalDateTime now);

    /**
     * Get announcements for specific target audience
     */
    @Query("SELECT a FROM AnnouncementJpaEntity a WHERE " +
           "a.isActive = true AND " +
           "a.status = 'PUBLISHED' AND " +
           "(a.startsAt IS NULL OR a.startsAt <= :now) AND " +
           "(a.expiresAt IS NULL OR a.expiresAt >= :now) AND " +
           "(a.targetUsers = com.perundhu.infrastructure.persistence.entity.AnnouncementJpaEntity$TargetAudience.ALL OR " +
           "a.targetUsers = :targetAudience) " +
           "ORDER BY a.priority DESC, a.createdAt DESC")
    List<AnnouncementJpaEntity> findByTargetAudience(
            @Param("targetAudience") AnnouncementJpaEntity.TargetAudience targetAudience,
            @Param("now") LocalDateTime now
    );

    /**
     * Get all announcements (admin view)
     */
    List<AnnouncementJpaEntity> findAllByOrderByPriorityDescCreatedAtDesc();

    /**
     * Get announcements by status
     */
    List<AnnouncementJpaEntity> findByStatus(String status);

    /**
     * Get expired announcements
     */
    @Query("SELECT a FROM AnnouncementJpaEntity a WHERE " +
           "a.expiresAt IS NOT NULL AND a.expiresAt < :now AND a.isActive = true")
    List<AnnouncementJpaEntity> findExpiredAnnouncements(@Param("now") LocalDateTime now);

    /**
     * Get upcoming announcements
     */
    @Query("SELECT a FROM AnnouncementJpaEntity a WHERE " +
           "a.startsAt IS NOT NULL AND a.startsAt > :now AND a.status = 'PUBLISHED'")
    List<AnnouncementJpaEntity> findUpcomingAnnouncements(@Param("now") LocalDateTime now);

    /**
     * Get announcements by type
     */
    List<AnnouncementJpaEntity> findByType(AnnouncementJpaEntity.AnnouncementType type);

    /**
     * Get announcements by category
     */
    List<AnnouncementJpaEntity> findByAnnouncementCategory(String category);

    /**
     * Check if unique ID exists
     */
    boolean existsByUniqueId(String uniqueId);
}
