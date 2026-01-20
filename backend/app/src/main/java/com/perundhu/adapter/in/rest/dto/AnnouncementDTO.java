package com.perundhu.adapter.in.rest.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
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

    @NotBlank(message = "Unique ID is required")
    @Size(max = 100, message = "Unique ID must not exceed 100 characters")
    private String uniqueId;

    @NotBlank(message = "Type is required")
    @Size(max = 50, message = "Type must not exceed 50 characters")
    private String type;

    @NotBlank(message = "Title key is required")
    @Size(max = 200, message = "Title key must not exceed 200 characters")
    private String titleKey;

    @NotBlank(message = "Title fallback is required")
    @Size(max = 500, message = "Title fallback must not exceed 500 characters")
    private String titleFallback;

    @NotBlank(message = "Message key is required")
    @Size(max = 200, message = "Message key must not exceed 200 characters")
    private String messageKey;

    @NotBlank(message = "Message fallback is required")
    @Size(max = 2000, message = "Message fallback must not exceed 2000 characters")
    private String messageFallback;

    @Size(max = 500, message = "Link must not exceed 500 characters")
    private String link;

    @Size(max = 200, message = "Link text key must not exceed 200 characters")
    private String linkTextKey;

    @Size(max = 500, message = "Link text fallback must not exceed 500 characters")
    private String linkTextFallback;

    @NotNull(message = "Active status is required")
    private Boolean isActive;

    @NotNull(message = "Dismissible status is required")
    private Boolean isDismissible;

    @NotNull(message = "Priority is required")
    private Integer priority;

    @Size(max = 100, message = "Announcement category must not exceed 100 characters")
    private String announcementCategory;

    @Size(max = 200, message = "Target users must not exceed 200 characters")
    private String targetUsers;

    @NotNull(message = "Display banner flag is required")
    private Boolean displayBanner;

    @NotNull(message = "Display modal flag is required")
    private Boolean displayModal;

    private LocalDateTime startsAt;
    private LocalDateTime expiresAt;
    private Long viewCount;
    private Long dismissCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Size(max = 100, message = "Created by must not exceed 100 characters")
    private String createdBy;

    @Size(max = 100, message = "Updated by must not exceed 100 characters")
    private String updatedBy;

    @Size(max = 50, message = "Status must not exceed 50 characters")
    private String status;
}
