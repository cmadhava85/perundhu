package com.perundhu.infrastructure.adapter.service;

import com.perundhu.infrastructure.persistence.entity.AnnouncementJpaEntity;
import com.perundhu.infrastructure.persistence.repository.AnnouncementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import static com.perundhu.infrastructure.config.CacheConfig.ANNOUNCEMENTS_CACHE;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Service for announcement management
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class AnnouncementService {

    private final AnnouncementRepository announcementRepository;

    /**
     * Create a new announcement
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public AnnouncementJpaEntity createAnnouncement(AnnouncementJpaEntity announcement) {
        log.info("Creating announcement with ID: {}", announcement.getUniqueId());

        if (announcementRepository.existsByUniqueId(announcement.getUniqueId())) {
            throw new IllegalArgumentException(
                    "Announcement with unique ID already exists: " + announcement.getUniqueId());
        }

        return announcementRepository.save(announcement);
    }

    /**
     * Update an announcement
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public AnnouncementJpaEntity updateAnnouncement(Long id, AnnouncementJpaEntity announcement) {
        log.info("Updating announcement with ID: {}", id);

        AnnouncementJpaEntity existing = announcementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found with ID: " + id));

        // Update fields
        existing.setType(announcement.getType());
        existing.setTitleKey(announcement.getTitleKey());
        existing.setTitleFallback(announcement.getTitleFallback());
        existing.setMessageKey(announcement.getMessageKey());
        existing.setMessageFallback(announcement.getMessageFallback());
        existing.setLink(announcement.getLink());
        existing.setLinkTextKey(announcement.getLinkTextKey());
        existing.setLinkTextFallback(announcement.getLinkTextFallback());
        existing.setIsActive(announcement.getIsActive());
        existing.setIsDismissible(announcement.getIsDismissible());
        existing.setPriority(announcement.getPriority());
        existing.setAnnouncementCategory(announcement.getAnnouncementCategory());
        existing.setTargetUsers(announcement.getTargetUsers());
        existing.setDisplayBanner(announcement.getDisplayBanner());
        existing.setDisplayModal(announcement.getDisplayModal());
        existing.setStartsAt(announcement.getStartsAt());
        existing.setExpiresAt(announcement.getExpiresAt());
        existing.setUpdatedBy(announcement.getUpdatedBy());
        existing.setStatus(announcement.getStatus());

        return announcementRepository.save(existing);
    }

    /**
     * Get announcement by ID
     */
    @Cacheable(value = ANNOUNCEMENTS_CACHE, key = "'announcement-' + #id")
    public Optional<AnnouncementJpaEntity> getAnnouncement(Long id) {
        return announcementRepository.findById(id);
    }

    /**
     * Get announcement by unique ID
     */
    @Cacheable(value = ANNOUNCEMENTS_CACHE, key = "'unique-' + #uniqueId")
    public Optional<AnnouncementJpaEntity> getAnnouncementByUniqueId(String uniqueId) {
        return announcementRepository.findByUniqueId(uniqueId);
    }

    /**
     * Get all active announcements (for public display)
     */
    @Cacheable(value = ANNOUNCEMENTS_CACHE, key = "'active'")
    public List<AnnouncementJpaEntity> getActiveAnnouncements() {
        return announcementRepository.findActiveAnnouncements(LocalDateTime.now());
    }

    /**
     * Get active announcements for target audience
     */
    @Cacheable(value = ANNOUNCEMENTS_CACHE, key = "'audience-' + #targetAudience")
    public List<AnnouncementJpaEntity> getAnnouncementsByAudience(AnnouncementJpaEntity.TargetAudience targetAudience) {
        return announcementRepository.findByTargetAudience(targetAudience, LocalDateTime.now());
    }

    /**
     * Get active announcements for target audience by string (controller-friendly)
     * Handles parsing of audience string to enum in service layer to avoid
     * controller-infrastructure coupling
     */
    public List<AnnouncementJpaEntity> getAnnouncementsByAudienceString(String audienceStr) {
        try {
            AnnouncementJpaEntity.TargetAudience targetAudience = AnnouncementJpaEntity.TargetAudience
                    .valueOf(audienceStr.toUpperCase());
            return getAnnouncementsByAudience(targetAudience);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid audience: " + audienceStr, e);
        }
    }

    /**
     * Get all announcements (admin view)
     */
    @Cacheable(value = ANNOUNCEMENTS_CACHE, key = "'all'")
    public List<AnnouncementJpaEntity> getAllAnnouncements() {
        return announcementRepository.findAllByOrderByPriorityDescCreatedAtDesc();
    }

    /**
     * Get announcements by status
     */
    public List<AnnouncementJpaEntity> getAnnouncementsByStatus(String status) {
        return announcementRepository.findByStatus(status);
    }

    /**
     * Get announcements by type
     */
    public List<AnnouncementJpaEntity> getAnnouncementsByType(AnnouncementJpaEntity.AnnouncementType type) {
        return announcementRepository.findByType(type);
    }

    /**
     * Get announcements by category
     */
    public List<AnnouncementJpaEntity> getAnnouncementsByCategory(String category) {
        return announcementRepository.findByAnnouncementCategory(category);
    }

    /**
     * Get expired announcements
     */
    public List<AnnouncementJpaEntity> getExpiredAnnouncements() {
        return announcementRepository.findExpiredAnnouncements(LocalDateTime.now());
    }

    /**
     * Get upcoming announcements
     */
    public List<AnnouncementJpaEntity> getUpcomingAnnouncements() {
        return announcementRepository.findUpcomingAnnouncements(LocalDateTime.now());
    }

    /**
     * Delete announcement
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public void deleteAnnouncement(Long id) {
        log.info("Deleting announcement with ID: {}", id);
        announcementRepository.deleteById(id);
    }

    /**
     * Publish announcement (set status to PUBLISHED and active)
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public AnnouncementJpaEntity publishAnnouncement(Long id, String publishedBy) {
        log.info("Publishing announcement with ID: {}", id);

        AnnouncementJpaEntity announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found with ID: " + id));

        announcement.setStatus("PUBLISHED");
        announcement.setIsActive(true);
        announcement.setUpdatedBy(publishedBy);

        return announcementRepository.save(announcement);
    }

    /**
     * Unpublish announcement
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public AnnouncementJpaEntity unpublishAnnouncement(Long id, String unpublishedBy) {
        log.info("Unpublishing announcement with ID: {}", id);

        AnnouncementJpaEntity announcement = announcementRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Announcement not found with ID: " + id));

        announcement.setStatus("DRAFT");
        announcement.setIsActive(false);
        announcement.setUpdatedBy(unpublishedBy);

        return announcementRepository.save(announcement);
    }

    /**
     * Save announcement (draft)
     */
    public AnnouncementJpaEntity saveAnnouncement(AnnouncementJpaEntity announcement, String savedBy) {
        announcement.setUpdatedBy(savedBy);
        announcement.setStatus("DRAFT");
        return announcementRepository.save(announcement);
    }

    /**
     * Track announcement view
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public void trackView(Long id) {
        announcementRepository.findById(id).ifPresent(announcement -> {
            announcement.setViewCount(announcement.getViewCount() + 1);
            announcementRepository.save(announcement);
        });
    }

    /**
     * Track announcement dismiss
     */
    @CacheEvict(value = ANNOUNCEMENTS_CACHE, allEntries = true)
    public void trackDismiss(Long id) {
        announcementRepository.findById(id).ifPresent(announcement -> {
            announcement.setDismissCount(announcement.getDismissCount() + 1);
            announcementRepository.save(announcement);
        });
    }

    /**
     * Get announcement statistics
     */
    public AnnouncementStats getStatistics() {
        LocalDateTime now = LocalDateTime.now();
        return new AnnouncementStats(
                announcementRepository.count(),
                announcementRepository.countActiveAnnouncements(now),
                announcementRepository.countExpiredAnnouncements(now),
                announcementRepository.countUpcomingAnnouncements(now),
                announcementRepository.sumViewCount(),
                announcementRepository.sumDismissCount());
    }

    /**
     * Statistics DTO
     */
    public record AnnouncementStats(
            Long total,
            Long active,
            Long expired,
            Long upcoming,
            Long totalViews,
            Long totalDismisses) {
    }
}
