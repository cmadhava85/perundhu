package com.perundhu.adapter.in.rest.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

/**
 * DTO for announcements
 * Used to transfer announcement data between API and clients
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AnnouncementDTO {

    private Long id;
    private String uniqueId;
    private String type;
    private String titleKey;
    private String titleFallback;
    private String messageKey;
    private String messageFallback;
    private String link;
    private String linkTextKey;
    private String linkTextFallback;
    private Boolean isActive;
    private Boolean isDismissible;
    private Integer priority;
    private String announcementCategory;
    private String targetUsers;
    private Boolean displayBanner;
    private Boolean displayModal;
    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
    private Long viewCount;
    private Long dismissCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
    private String status;
}
