package com.perundhu.domain.model;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Domain model for user feedback submitted through the Contact Us form.
 * Users can provide feedback, suggestions, and attach screenshots of errors.
 * This is a pure domain object without framework annotations.
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserFeedback {

    private Long id;
    private String category;
    private String message;
    private String email;
    private String screenshotFilename;
    private String screenshotUrl;
    private String userAgent;
    private String pageUrl;
    private String ipAddress;
    @Builder.Default
    private FeedbackStatus status = FeedbackStatus.NEW;
    private String adminNotes;
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime updatedAt;
    private LocalDateTime reviewedAt;
    private String reviewedBy;

    /**
     * Categories of feedback
     */
    public enum FeedbackCategory {
        SUGGESTION("suggestion"),
        BUG("bug"),
        FEATURE("feature"),
        GENERAL("general");

        private final String value;

        FeedbackCategory(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }

        public static FeedbackCategory fromValue(String value) {
            for (FeedbackCategory category : FeedbackCategory.values()) {
                if (category.value.equalsIgnoreCase(value)) {
                    return category;
                }
            }
            return GENERAL;
        }
    }

    /**
     * Status of the feedback
     */
    public enum FeedbackStatus {
        NEW("new"),
        ACKNOWLEDGED("acknowledged"),
        UNDER_REVIEW("under_review"),
        RESOLVED("resolved"),
        ARCHIVED("archived");

        private final String value;

        FeedbackStatus(String value) {
            this.value = value;
        }

        public String getValue() {
            return value;
        }
    }
}
