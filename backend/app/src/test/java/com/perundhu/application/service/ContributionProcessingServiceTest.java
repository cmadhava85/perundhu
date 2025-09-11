package com.perundhu.application.service;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.RouteContributionRepository;
import com.perundhu.domain.port.ImageContributionRepository;
import com.perundhu.application.service.LocationValidationService;
import com.perundhu.application.service.NotificationService;
import com.perundhu.domain.service.OCRService;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class ContributionProcessingServiceTest {

        @Mock
        private RouteContributionRepository routeContributionRepository;

        @Mock
        private ImageContributionRepository imageContributionRepository;

        @Mock
        private BusRepository busRepository;

        @Mock
        private LocationRepository locationRepository;

        @Mock
        private StopRepository stopRepository;

        @Mock
        private OCRService ocrService;

        @Mock
        private LocationValidationService locationValidationService;

        @Mock
        private NotificationService notificationService;

        @InjectMocks
        private ContributionProcessingService contributionProcessingService;

        private RouteContribution pendingContribution;
        private RouteContribution approvedContribution;

        @BeforeEach
        void setUp() {
                pendingContribution = RouteContribution.builder()
                                .id("1")
                                .userId("user123")
                                .busNumber("175")
                                .busName("Kottayam - Kumily")
                                .fromLocationName("Kottayam")
                                .toLocationName("Kumily")
                                .fromLatitude(9.5916)
                                .fromLongitude(76.5222)
                                .toLatitude(9.6091)
                                .toLongitude(77.1647)
                                .departureTime("06:30")
                                .arrivalTime("09:00")
                                .scheduleInfo("Daily service")
                                .submissionDate(LocalDateTime.now().minusDays(1))
                                .status("PENDING")
                                .additionalNotes("New route contribution")
                                .submittedBy("user123")
                                .build();

                approvedContribution = RouteContribution.builder()
                                .id("2")
                                .userId("user456")
                                .busNumber("176")
                                .busName("Ernakulam - Thekkady")
                                .fromLocationName("Ernakulam")
                                .toLocationName("Thekkady")
                                .fromLatitude(9.9312)
                                .fromLongitude(76.2673)
                                .toLatitude(9.6091)
                                .toLongitude(77.1647)
                                .departureTime("07:00")
                                .arrivalTime("10:30")
                                .scheduleInfo("Daily except Sunday")
                                .submissionDate(LocalDateTime.now().minusDays(2))
                                .status("APPROVED")
                                .additionalNotes("Verified route")
                                .submittedBy("user456")
                                .build();
        }

        @Test
        void testProcessRouteContributions_ProcessesPendingContributions() {
                // Given
                when(routeContributionRepository.findByStatus("PENDING"))
                                .thenReturn(Arrays.asList(pendingContribution));

                // Mock the save operation to return the updated contribution
                when(routeContributionRepository.save(any(RouteContribution.class)))
                                .thenReturn(pendingContribution);

                // When
                contributionProcessingService.processRouteContributions();

                // Then
                verify(routeContributionRepository).findByStatus("PENDING");
                verify(routeContributionRepository, atLeastOnce()).save(any(RouteContribution.class));
        }

        @Test
        void testProcessRouteContributions_HandlesNoContributions() {
                // Given
                when(routeContributionRepository.findByStatus("PENDING"))
                                .thenReturn(Collections.emptyList());

                // When
                contributionProcessingService.processRouteContributions();

                // Then
                verify(routeContributionRepository).findByStatus("PENDING");
                verify(routeContributionRepository, never()).save(any(RouteContribution.class));
        }

        @Test
        void testProcessRouteContribution_ValidatesBasicFields() {
                // Given - Create a contribution that has null time fields to test validation
                RouteContribution invalidContribution = RouteContribution.builder()
                                .id("3")
                                .userId("user789")
                                .busNumber("") // Invalid: empty bus number
                                .fromLocationName("Location A")
                                .toLocationName("Location B")
                                .fromLatitude(13.0827) // Valid coordinates to pass location validation
                                .fromLongitude(80.2707)
                                .toLatitude(12.9716)
                                .toLongitude(77.5946)
                                .departureTime(null) // This will cause the service to fail with NullPointerException
                                .arrivalTime(null)
                                .status("PENDING")
                                .submissionDate(LocalDateTime.now())
                                .submittedBy("user789")
                                .build();

                // Mock location validation to return true so we get past location validation
                when(locationValidationService.validateLocation(anyString(), anyDouble(), anyDouble()))
                                .thenReturn(true);

                when(routeContributionRepository.findByStatus("PENDING"))
                                .thenReturn(Arrays.asList(invalidContribution));
                when(routeContributionRepository.save(any(RouteContribution.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                // When
                contributionProcessingService.processRouteContributions();

                // Then - Verify that the contribution was marked as FAILED due to processing
                // error
                verify(routeContributionRepository)
                                .save(argThat(contribution -> "FAILED".equals(contribution.getStatus()) &&
                                                contribution.getValidationMessage() != null &&
                                                contribution.getValidationMessage().contains("Processing error")));
        }

        @Test
        void testProcessRouteContribution_ValidatesLocationFields() {
                // Given
                RouteContribution invalidContribution = RouteContribution.builder()
                                .id("4")
                                .userId("user789")
                                .busNumber("180")
                                .fromLocationName("") // Invalid: empty location name
                                .toLocationName("Location B")
                                .fromLatitude(null) // Invalid: missing coordinates
                                .fromLongitude(76.0)
                                .status("PENDING")
                                .submissionDate(LocalDateTime.now())
                                .submittedBy("user789")
                                .build();

                when(routeContributionRepository.findByStatus("PENDING"))
                                .thenReturn(Arrays.asList(invalidContribution));
                when(routeContributionRepository.save(any(RouteContribution.class)))
                                .thenAnswer(invocation -> invocation.getArgument(0));

                // When
                contributionProcessingService.processRouteContributions();

                // Then
                verify(routeContributionRepository)
                                .save(argThat(contribution -> "REJECTED".equals(contribution.getStatus()) &&
                                                contribution.getValidationMessage() != null &&
                                                contribution.getValidationMessage().contains("location")));
        }
}