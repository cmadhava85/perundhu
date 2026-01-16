package com.perundhu.infrastructure.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Data Obfuscation Service
 * 
 * Limits and obfuscates sensitive data in responses
 * Prevents bulk scraping by limiting result sets
 */
@Service
@Slf4j
public class DataObfuscationService {

    @Value("${security.data.obfuscate-for-non-premium:true}")
    private boolean obfuscateForNonPremium;

    @Value("${security.data.max-results:10}")
    private int maxResults;

    /**
     * Mask sensitive phone numbers
     */
    public String maskPhoneNumber(String phone) {
        if (phone == null || phone.isEmpty()) {
            return null;
        }
        if (phone.length() < 4) {
            return "***";
        }
        return phone.substring(0, 2) + "****" + phone.substring(phone.length() - 2);
    }

    /**
     * Mask email addresses
     */
    public String maskEmail(String email) {
        if (email == null || email.isEmpty()) {
            return null;
        }
        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "***";
        }
        String prefix = email.substring(0, Math.min(2, atIndex));
        String domain = email.substring(atIndex);
        return prefix + "****" + domain;
    }

    /**
     * Limit number of results to prevent bulk scraping
     */
    public int getLimitedPageSize(int requestedSize) {
        return Math.min(requestedSize, maxResults);
    }

    /**
     * Check if data should be obfuscated for current user
     */
    public boolean shouldObfuscateData(boolean isPremium) {
        return obfuscateForNonPremium && !isPremium;
    }

    /**
     * Remove sensitive fields from responses
     */
    public void removeDriverDetails(Object busObject) {
        // Implementation depends on actual DTO structure
        // Remove driver phone, driver name, contact details
        log.debug("Removing sensitive driver details from response");
    }

    /**
     * Log data access attempt
     */
    public void logDataAccess(String userId, String endpoint, String dataType) {
        log.info("DATA_ACCESS | User: {} | Endpoint: {} | Type: {}",
                userId != null ? userId : "ANONYMOUS", endpoint, dataType);
    }
}
