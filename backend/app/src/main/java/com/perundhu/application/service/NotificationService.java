package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;

/**
 * Service for handling notifications to users
 */
@Service("applicationNotificationService")
public class NotificationService {

    private static final Logger log = LoggerFactory.getLogger(NotificationService.class);

    /**
     * Default constructor as there are no dependencies to inject
     */
    public NotificationService() {
        // No dependencies to inject
    }

    /**
     * Notify user that their contribution was approved
     * 
     * @param contribution The approved contribution
     */
    public void notifyContributionApproved(RouteContribution contribution) {
        if (isInvalidContribution(contribution)) {
            return;
        }

        // In a real implementation, this would use a messaging/email service
        // For now, we'll just log the notification
        log.info("NOTIFICATION to user {}: Your route contribution from {} to {} has been approved!",
                contribution.userId(),
                contribution.fromLocationName(),
                contribution.toLocationName());

        // Future: Send push notification, email or in-app message
    }

    /**
     * Notify user that their contribution was rejected
     * 
     * @param contribution The rejected contribution
     */
    public void notifyContributionRejected(RouteContribution contribution) {
        if (isInvalidContribution(contribution)) {
            return;
        }

        log.info("NOTIFICATION to user {}: Your route contribution from {} to {} could not be processed: {}",
                contribution.userId(),
                contribution.fromLocationName(),
                contribution.toLocationName(),
                contribution.validationMessage());
    }

    /**
     * Notify user that their image contribution was approved
     * 
     * @param contribution The approved image contribution
     */
    public void notifyContributionApproved(ImageContribution contribution) {
        if (isInvalidContribution(contribution)) {
            return;
        }

        log.info("NOTIFICATION to user {}: Your image contribution has been approved!",
                contribution.userId());
    }

    /**
     * Notify user that their image contribution was rejected
     * 
     * @param contribution The rejected image contribution
     */
    public void notifyContributionRejected(ImageContribution contribution) {
        if (isInvalidContribution(contribution)) {
            return;
        }

        log.info("NOTIFICATION to user {}: Your image contribution could not be processed: {}",
                contribution.userId(),
                contribution.validationMessage());
    }

    /**
     * Generic notification method that uses pattern matching for different
     * contribution types
     * 
     * @param contribution The contribution that generated the notification
     * @param isApproved   Whether the contribution was approved or rejected
     */
    public void notifyUser(Object contribution, boolean isApproved) {
        if (contribution instanceof RouteContribution routeContribution) {
            if (isApproved) {
                notifyContributionApproved(routeContribution);
            } else {
                notifyContributionRejected(routeContribution);
            }
        } else if (contribution instanceof ImageContribution imageContribution) {
            if (isApproved) {
                notifyContributionApproved(imageContribution);
            } else {
                notifyContributionRejected(imageContribution);
            }
        } else {
            log.warn("Unknown contribution type: {}",
                    contribution != null ? contribution.getClass().getName() : "null");
        }
    }

    /**
     * Check if a contribution is invalid (null or missing user ID)
     * 
     * @param contribution The contribution to check
     * @return true if the contribution is invalid
     */
    private boolean isInvalidContribution(Object contribution) {
        if (contribution == null) {
            log.warn("Cannot notify user for null contribution");
            return true;
        }

        // Standard pattern matching approach without preview features
        if (contribution instanceof RouteContribution rc) {
            if (rc.userId() == null) {
                log.warn("Cannot notify user for route contribution with missing user ID");
                return true;
            }
            return false;
        } else if (contribution instanceof ImageContribution ic) {
            if (ic.userId() == null) {
                log.warn("Cannot notify user for image contribution with missing user ID");
                return true;
            }
            return false;
        } else {
            log.warn("Cannot notify user for unknown contribution type: {}",
                    contribution.getClass().getName());
            return true;
        }
    }
}
