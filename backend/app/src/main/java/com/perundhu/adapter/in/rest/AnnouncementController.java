package com.perundhu.adapter.in.rest;

import com.perundhu.adapter.in.rest.dto.AnnouncementDTO;
import com.perundhu.adapter.in.rest.mapper.AnnouncementMapper;
import com.perundhu.infrastructure.adapter.service.AnnouncementService;
import com.perundhu.infrastructure.persistence.entity.AnnouncementJpaEntity;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * REST controller for announcement management
 */
@RestController
@RequestMapping("")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = "*", maxAge = 3600)
public class AnnouncementController {

    private final AnnouncementService announcementService;
    private final AnnouncementMapper announcementMapper = new AnnouncementMapper();

    /**
     * Get all active announcements (public endpoint)
     */
    @GetMapping("/v1/announcements")
    public ResponseEntity<List<AnnouncementDTO>> getActiveAnnouncements() {
        log.info("Fetching active announcements");
        List<AnnouncementJpaEntity> entities = announcementService.getActiveAnnouncements();
        return ResponseEntity.ok(announcementMapper.toDTOList(entities));
    }

    /**
     * Get announcements by target audience (public endpoint)
     */
    @GetMapping("/v1/announcements/audience/{audience}")
    public ResponseEntity<List<AnnouncementDTO>> getAnnouncementsByAudience(
            @PathVariable String audience) {
        log.info("Fetching announcements for audience: {}", audience);
        try {
            // Parse audience string and delegate to service
            // Service will handle the JPA entity enum conversion
            List<AnnouncementJpaEntity> entities = announcementService.getAnnouncementsByAudienceString(audience);
            return ResponseEntity.ok(announcementMapper.toDTOList(entities));
        } catch (IllegalArgumentException e) {
            log.error("Invalid audience: {}", audience);
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Track announcement view (public endpoint)
     */
    @PostMapping("/v1/announcements/{id}/view")
    public ResponseEntity<Void> trackAnnouncementView(@PathVariable Long id) {
        log.info("Tracking view for announcement: {}", id);
        announcementService.trackView(id);
        return ResponseEntity.ok().build();
    }

    /**
     * Track announcement dismiss (public endpoint)
     */
    @PostMapping("/v1/announcements/{id}/dismiss")
    public ResponseEntity<Void> trackAnnouncementDismiss(@PathVariable Long id) {
        log.info("Tracking dismiss for announcement: {}", id);
        announcementService.trackDismiss(id);
        return ResponseEntity.ok().build();
    }

    // ===== ADMIN ENDPOINTS =====

    /**
     * Get all announcements (admin only)
     */
    @GetMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementDTO>> getAllAnnouncements() {
        log.info("Admin: Fetching all announcements");
        List<AnnouncementJpaEntity> entities = announcementService.getAllAnnouncements();
        return ResponseEntity.ok(announcementMapper.toDTOList(entities));
    }

    /**
     * Get announcement by ID (admin only)
     */
    @GetMapping("/admin/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> getAnnouncement(@PathVariable Long id) {
        log.info("Admin: Fetching announcement with ID: {}", id);
        return announcementService.getAnnouncement(id)
                .map(announcementMapper::toDTO)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * Create new announcement (admin only)
     */
    @PostMapping("/admin/announcements")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> createAnnouncement(
            @RequestBody AnnouncementDTO announcement,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        log.info("Admin: Creating announcement with ID: {}", announcement.getUniqueId());
        try {
            announcement.setCreatedBy(userId != null ? userId : "admin");
            announcement.setUpdatedBy(userId != null ? userId : "admin");
            AnnouncementJpaEntity entity = announcementMapper.toEntity(announcement);
            AnnouncementJpaEntity created = announcementService.createAnnouncement(entity);
            return ResponseEntity.status(HttpStatus.CREATED).body(announcementMapper.toDTO(created));
        } catch (IllegalArgumentException e) {
            log.error("Failed to create announcement: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    /**
     * Update announcement (admin only)
     */
    @PutMapping("/admin/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> updateAnnouncement(
            @PathVariable Long id,
            @RequestBody AnnouncementDTO announcement,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        log.info("Admin: Updating announcement with ID: {}", id);
        try {
            announcement.setUpdatedBy(userId != null ? userId : "admin");
            AnnouncementJpaEntity entity = announcementMapper.toEntity(announcement);
            AnnouncementJpaEntity updated = announcementService.updateAnnouncement(id, entity);
            return ResponseEntity.ok(announcementMapper.toDTO(updated));
        } catch (IllegalArgumentException e) {
            log.error("Failed to update announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Delete announcement (admin only)
     */
    @DeleteMapping("/admin/announcements/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteAnnouncement(@PathVariable Long id) {
        log.info("Admin: Deleting announcement with ID: {}", id);
        try {
            announcementService.deleteAnnouncement(id);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            log.error("Failed to delete announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Publish announcement (admin only)
     */
    @PostMapping("/admin/announcements/{id}/publish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> publishAnnouncement(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        log.info("Admin: Publishing announcement with ID: {}", id);
        try {
            AnnouncementJpaEntity published = announcementService.publishAnnouncement(id,
                    userId != null ? userId : "admin");
            return ResponseEntity.ok(announcementMapper.toDTO(published));
        } catch (IllegalArgumentException e) {
            log.error("Failed to publish announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Unpublish announcement (admin only)
     */
    @PostMapping("/admin/announcements/{id}/unpublish")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<AnnouncementDTO> unpublishAnnouncement(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Id", required = false) String userId) {
        log.info("Admin: Unpublishing announcement with ID: {}", id);
        try {
            AnnouncementJpaEntity unpublished = announcementService.unpublishAnnouncement(id,
                    userId != null ? userId : "admin");
            return ResponseEntity.ok(announcementMapper.toDTO(unpublished));
        } catch (IllegalArgumentException e) {
            log.error("Failed to unpublish announcement: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    /**
     * Get announcements by status (admin only)
     */
    @GetMapping("/admin/announcements/status/{status}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<AnnouncementDTO>> getAnnouncementsByStatus(
            @PathVariable String status) {
        log.info("Admin: Fetching announcements with status: {}", status);
        List<AnnouncementJpaEntity> entities = announcementService.getAnnouncementsByStatus(status);
        return ResponseEntity.ok(announcementMapper.toDTOList(entities));
    }

    /**
     * Get announcement statistics (admin only)
     */
    @GetMapping("/admin/announcements/stats")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, Object>> getStatistics() {
        log.info("Admin: Fetching announcement statistics");
        AnnouncementService.AnnouncementStats stats = announcementService.getStatistics();
        return ResponseEntity.ok(Map.of(
                "total", stats.total(),
                "active", stats.active(),
                "expired", stats.expired(),
                "upcoming", stats.upcoming(),
                "totalViews", stats.totalViews(),
                "totalDismisses", stats.totalDismisses()));
    }
}
