package com.perundhu.infrastructure.persistence.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * JPA Entity for announcements displayed on the frontend
 */
@Entity
@Table(name = "announcements", indexes = {
    @Index(name = "idx_announcements_active", columnList = "is_active"),
    @Index(name = "idx_announcements_expires", columnList = "expires_at"),
    @Index(name = "idx_announcements_priority", columnList = "priority"),
    @Index(name = "idx_announcements_unique_id", columnList = "unique_id")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unique_id", nullable = false, unique = true, length = 100)
    private String uniqueId;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private AnnouncementType type;

    @Column(name = "title_key", nullable = false, length = 255)
    private String titleKey;

    @Column(name = "title_fallback", nullable = false, length = 255)
    private String titleFallback;

    @Column(name = "message_key", nullable = false, length = 255)
    private String messageKey;

    @Column(name = "message_fallback", nullable = false, columnDefinition = "TEXT")
    private String messageFallback;

    @Column(name = "link", length = 500)
    private String link;

    @Column(name = "link_text_key", length = 255)
    private String linkTextKey;

    @Column(name = "link_text_fallback", length = 255)
    private String linkTextFallback;

    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = false;

    @Column(name = "is_dismissible", nullable = false)
    @Builder.Default
    private Boolean isDismissible = true;

    @Column(name = "priority", nullable = false)
    @Builder.Default
    private Integer priority = 5;

    @Column(name = "announcement_category", length = 50)
    private String announcementCategory;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_users", nullable = false)
    @Builder.Default
    private TargetAudience targetUsers = TargetAudience.ALL;

    @Column(name = "display_banner", nullable = false)
    @Builder.Default
    private Boolean displayBanner = true;

    @Column(name = "display_modal", nullable = false)
    @Builder.Default
    private Boolean displayModal = false;

    @Column(name = "starts_at")
    private LocalDateTime startsAt;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "view_count", nullable = false)
    @Builder.Default
    private Long viewCount = 0L;

    @Column(name = "dismiss_count", nullable = false)
    @Builder.Default
    private Long dismissCount = 0L;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "updated_by", length = 100)
    private String updatedBy;

    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private String status = "DRAFT";

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
        if (status == null) {
            status = "DRAFT";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /**
     * Types of announcements
     */
    public enum AnnouncementType {
        INFO,
        WARNING,
        SUCCESS,
        NEW_FEATURE,
        MAINTENANCE
    }

    /**
     * Target audience for announcements
     */
    public enum TargetAudience {
        ALL,
        ADMIN,
        CONTRIBUTORS,
        REGULAR_USERS
    }
}
