package com.perundhu.domain.model;

/**
 * Enumeration of contribution statuses following SOLID principles.
 * Replaces hardcoded strings throughout the codebase.
 */
public enum ContributionStatus {
    /**
     * Contribution has been submitted and awaiting review
     */
    PENDING("PENDING"),
    
    /**
     * Contribution has been approved by admin
     */
    APPROVED("APPROVED"),
    
    /**
     * Contribution has been rejected by admin
     */
    REJECTED("REJECTED"),
    
    /**
     * Contribution has been integrated into the main bus database
     */
    INTEGRATED("INTEGRATED"),
    
    /**
     * Integration into bus database failed
     */
    INTEGRATION_FAILED("INTEGRATION_FAILED"),
    
    /**
     * Contribution is a duplicate of an existing entry
     */
    DUPLICATE("DUPLICATE"),
    
    /**
     * Contribution processing failed
     */
    FAILED("FAILED"),
    
    /**
     * Contribution requires manual review
     */
    MANUAL_REVIEW_NEEDED("MANUAL_REVIEW_NEEDED"),
    
    /**
     * Contribution is pending review after manual corrections
     */
    PENDING_REVIEW("PENDING_REVIEW");
    
    private final String value;
    
    ContributionStatus(String value) {
        this.value = value;
    }
    
    public String getValue() {
        return value;
    }
    
    /**
     * Convert from string to enum
     * @param value String value
     * @return ContributionStatus enum
     * @throws IllegalArgumentException if value is not valid
     */
    public static ContributionStatus fromString(String value) {
        if (value == null) {
            return PENDING;
        }
        
        for (ContributionStatus status : ContributionStatus.values()) {
            if (status.value.equalsIgnoreCase(value)) {
                return status;
            }
        }
        
        throw new IllegalArgumentException("Invalid contribution status: " + value);
    }
    
    @Override
    public String toString() {
        return value;
    }
}
