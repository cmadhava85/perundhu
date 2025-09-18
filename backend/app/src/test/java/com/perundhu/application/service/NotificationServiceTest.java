package com.perundhu.application.service;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.ImageContribution;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Nested;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Notification Service Tests")
class NotificationServiceTest {

    private NotificationService notificationService;

    @BeforeEach
    void setUp() {
        notificationService = new NotificationService();
    }

    @Nested
    @DisplayName("Route Contribution Notification Tests")
    class RouteContributionNotificationTests {

        @Test
        @DisplayName("Should notify route contribution approval successfully")
        void shouldNotifyRouteContributionApprovalSuccessfully() {
            // Given
            RouteContribution contribution = RouteContribution.builder()
                    .id("route123")
                    .userId("user123")
                    .busNumber("101")
                    .fromLocationName("Central Station")
                    .toLocationName("Airport")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionApproved(contribution))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should notify route contribution rejection successfully")
        void shouldNotifyRouteContributionRejectionSuccessfully() {
            // Given
            RouteContribution contribution = RouteContribution.builder()
                    .id("route123")
                    .userId("user123")
                    .busNumber("101")
                    .fromLocationName("Central Station")
                    .toLocationName("Airport")
                    .validationMessage("Invalid route data")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionRejected(contribution))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle null route contribution gracefully")
        void shouldHandleNullRouteContributionGracefully() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionApproved((RouteContribution) null))
                    .doesNotThrowAnyException();
            
            assertThatCode(() -> notificationService.notifyContributionRejected((RouteContribution) null))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle route contribution with missing user ID")
        void shouldHandleRouteContributionWithMissingUserId() {
            // Given
            RouteContribution contribution = RouteContribution.builder()
                    .id("route123")
                    .userId(null) // missing user ID
                    .busNumber("101")
                    .fromLocationName("Central Station")
                    .toLocationName("Airport")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionApproved(contribution))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Image Contribution Notification Tests")
    class ImageContributionNotificationTests {

        @Test
        @DisplayName("Should notify image contribution approval successfully")
        void shouldNotifyImageContributionApprovalSuccessfully() {
            // Given
            ImageContribution contribution = ImageContribution.builder()
                    .id("image123")
                    .userId("user123")
                    .location("Central Station")
                    .imageUrl("path/to/image.jpg")
                    .description("Image description")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionApproved(contribution))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should notify image contribution rejection successfully")
        void shouldNotifyImageContributionRejectionSuccessfully() {
            // Given
            ImageContribution contribution = ImageContribution.builder()
                    .id("image123")
                    .userId("user123")
                    .location("Central Station")
                    .imageUrl("path/to/image.jpg")
                    .description("Image description")
                    .validationMessage("Poor image quality")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionRejected(contribution))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle null image contribution gracefully")
        void shouldHandleNullImageContributionGracefully() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionApproved((ImageContribution) null))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle image contribution with missing user ID")
        void shouldHandleImageContributionWithMissingUserId() {
            // Given
            ImageContribution contribution = ImageContribution.builder()
                    .id("image123")
                    .userId(null) // missing user ID
                    .location("Central Station")
                    .imageUrl("path/to/image.jpg")
                    .description("Image description")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionApproved(contribution))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Generic Notification Tests")
    class GenericNotificationTests {

        @Test
        @DisplayName("Should handle generic route contribution approval")
        void shouldHandleGenericRouteContributionApproval() {
            // Given
            RouteContribution contribution = RouteContribution.builder()
                    .id("route123")
                    .userId("user123")
                    .busNumber("101")
                    .fromLocationName("Central Station")
                    .toLocationName("Airport")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyUser(contribution, true))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle generic route contribution rejection")
        void shouldHandleGenericRouteContributionRejection() {
            // Given
            RouteContribution contribution = RouteContribution.builder()
                    .id("route123")
                    .userId("user123")
                    .busNumber("101")
                    .fromLocationName("Central Station")
                    .toLocationName("Airport")
                    .validationMessage("Initial validation")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyUser(contribution, false))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle generic image contribution approval")
        void shouldHandleGenericImageContributionApproval() {
            // Given
            ImageContribution contribution = ImageContribution.builder()
                    .id("image123")
                    .userId("user123")
                    .location("Central Station")
                    .imageUrl("path/to/image.jpg")
                    .description("Image description")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyUser(contribution, true))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle generic image contribution rejection")
        void shouldHandleGenericImageContributionRejection() {
            // Given
            ImageContribution contribution = ImageContribution.builder()
                    .id("image123")
                    .userId("user123")
                    .location("Central Station")
                    .imageUrl("path/to/image.jpg")
                    .description("Image description")
                    .validationMessage("Image validation")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyUser(contribution, false))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle unknown contribution type")
        void shouldHandleUnknownContributionType() {
            // Given
            String unknownContribution = "not a contribution";

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyUser(unknownContribution, true))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle null contribution in generic method")
        void shouldHandleNullContributionInGenericMethod() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyUser(null, true))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("General Notification Tests")
    class GeneralNotificationTests {

        @Test
        @DisplayName("Should send general notification successfully")
        void shouldSendGeneralNotificationSuccessfully() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification("user123", "Welcome", "Welcome to our service!"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle general notification with null user ID")
        void shouldHandleGeneralNotificationWithNullUserId() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification(null, "Title", "Message"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle general notification with null title")
        void shouldHandleGeneralNotificationWithNullTitle() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification("user123", null, "Message"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle general notification with null message")
        void shouldHandleGeneralNotificationWithNullMessage() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification("user123", "Title", null))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle general notification with empty strings")
        void shouldHandleGeneralNotificationWithEmptyStrings() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification("", "", ""))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle general notification with very long content")
        void shouldHandleGeneralNotificationWithVeryLongContent() {
            // Given
            String longUserId = "user" + "a".repeat(100);
            String longTitle = "Title" + "b".repeat(500);
            String longMessage = "Message" + "c".repeat(1000);

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification(longUserId, longTitle, longMessage))
                    .doesNotThrowAnyException();
        }
    }

    @Nested
    @DisplayName("Performance and Edge Cases")
    class PerformanceAndEdgeCases {

        @Test
        @DisplayName("Should handle multiple rapid notifications")
        void shouldHandleMultipleRapidNotifications() {
            // When/Then - Should not throw exception
            assertThatCode(() -> {
                for (int i = 0; i < 50; i++) {
                    notificationService.sendNotification("user" + i, "Title" + i, "Message" + i);
                }
            }).doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle notifications with special characters")
        void shouldHandleNotificationsWithSpecialCharacters() {
            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.sendNotification(
                    "user@#$%^&*()",
                    "Title with émojis 🚌🚍🚎",
                    "Message with special chars: <>&\"'`"))
                    .doesNotThrowAnyException();
        }

        @Test
        @DisplayName("Should handle contribution with special characters in validation message")
        void shouldHandleContributionWithSpecialCharactersInValidationMessage() {
            // Given
            RouteContribution contribution = RouteContribution.builder()
                    .id("route123")
                    .userId("user123")
                    .busNumber("101")
                    .fromLocationName("Central Station")
                    .toLocationName("Airport")
                    .validationMessage("Special chars: <>&\"'` and émojis 🚌")
                    .build();

            // When/Then - Should not throw exception
            assertThatCode(() -> notificationService.notifyContributionRejected(contribution))
                    .doesNotThrowAnyException();
        }
    }
}