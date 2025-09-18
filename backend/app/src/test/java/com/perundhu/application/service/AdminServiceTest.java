package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.port.ImageContributionOutputPort;
import com.perundhu.domain.port.RouteContributionPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("Admin Service Tests")
class AdminServiceTest {

    @Mock
    private RouteContributionPort routeContributionPort;

    @Mock
    private ImageContributionOutputPort imageContributionOutputPort;

    @Mock
    private ContributionProcessingService contributionProcessingService;

    @InjectMocks
    private AdminService adminService;

    private RouteContribution sampleRouteContribution;
    private ImageContribution sampleImageContribution;

    @BeforeEach
    void setUp() {
        sampleRouteContribution = RouteContribution.builder()
                .id("route123")
                .userId("user456")
                .busNumber("101")
                .busName("City Express")
                .fromLocationName("Central Station")
                .toLocationName("Airport")
                .status("PENDING")
                .submissionDate(LocalDateTime.now().minusDays(1))
                .build();

        sampleImageContribution = ImageContribution.builder()
                .id("image123")
                .userId("user789")
                .imageUrl("https://example.com/image.jpg")
                .description("Bus schedule photo")
                .status("PENDING")
                .submissionDate(LocalDateTime.now().minusDays(1))
                .build();
    }

    @Nested
    @DisplayName("Route Contribution Tests")
    class RouteContributionTests {

        @Test
        @DisplayName("Should get all route contributions")
        void shouldGetAllRouteContributions() {
            // Given
            List<RouteContribution> expectedContributions = Arrays.asList(sampleRouteContribution);
            when(routeContributionPort.findAllRouteContributions()).thenReturn(expectedContributions);

            // When
            List<RouteContribution> result = adminService.getAllRouteContributions();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo("route123");
            verify(routeContributionPort).findAllRouteContributions();
        }

        @Test
        @DisplayName("Should get pending route contributions")
        void shouldGetPendingRouteContributions() {
            // Given
            List<RouteContribution> pendingContributions = Arrays.asList(sampleRouteContribution);
            when(routeContributionPort.findRouteContributionsByStatus("PENDING"))
                    .thenReturn(pendingContributions);

            // When
            List<RouteContribution> result = adminService.getPendingRouteContributions();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
            verify(routeContributionPort).findRouteContributionsByStatus("PENDING");
        }

        @Test
        @DisplayName("Should approve route contribution successfully")
        void shouldApproveRouteContributionSuccessfully() {
            // Given
            when(routeContributionPort.findRouteContributionById("route123"))
                    .thenReturn(Optional.of(sampleRouteContribution));
            when(routeContributionPort.saveRouteContribution(any(RouteContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            RouteContribution result = adminService.approveRouteContribution("route123");

            // Then
            assertThat(result.getStatus()).isEqualTo("APPROVED");
            assertThat(result.getProcessedDate()).isNotNull();
            assertThat(result.getValidationMessage()).isEqualTo("Approved by admin");
            verify(routeContributionPort).saveRouteContribution(any(RouteContribution.class));
        }

        @Test
        @DisplayName("Should reject route contribution with reason")
        void shouldRejectRouteContributionWithReason() {
            // Given
            String rejectionReason = "Invalid bus route";
            when(routeContributionPort.findRouteContributionById("route123"))
                    .thenReturn(Optional.of(sampleRouteContribution));
            when(routeContributionPort.saveRouteContribution(any(RouteContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            RouteContribution result = adminService.rejectRouteContribution("route123", rejectionReason);

            // Then
            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(result.getValidationMessage()).isEqualTo(rejectionReason);
            verify(routeContributionPort).saveRouteContribution(any(RouteContribution.class));
        }

        @Test
        @DisplayName("Should throw exception when route contribution not found for approval")
        void shouldThrowExceptionWhenRouteContributionNotFoundForApproval() {
            // Given
            when(routeContributionPort.findRouteContributionById("nonexistent"))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.approveRouteContribution("nonexistent"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Route contribution not found: nonexistent");
        }

        @Test
        @DisplayName("Should throw exception when route contribution not found for rejection")
        void shouldThrowExceptionWhenRouteContributionNotFoundForRejection() {
            // Given
            when(routeContributionPort.findRouteContributionById("nonexistent"))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.rejectRouteContribution("nonexistent", "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Route contribution not found: nonexistent");
        }

        @Test
        @DisplayName("Should delete route contribution")
        void shouldDeleteRouteContribution() {
            // When
            adminService.deleteRouteContribution("route123");

            // Then
            verify(routeContributionPort).deleteRouteContribution("route123");
        }

        @Test
        @DisplayName("Should handle empty pending contributions list")
        void shouldHandleEmptyPendingContributionsList() {
            // Given
            when(routeContributionPort.findRouteContributionsByStatus("PENDING"))
                    .thenReturn(Collections.emptyList());

            // When
            List<RouteContribution> result = adminService.getPendingRouteContributions();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Image Contribution Tests")
    class ImageContributionTests {

        @Test
        @DisplayName("Should get all image contributions")
        void shouldGetAllImageContributions() {
            // Given
            List<ImageContribution> expectedContributions = Arrays.asList(sampleImageContribution);
            when(imageContributionOutputPort.findAll()).thenReturn(expectedContributions);

            // When
            List<ImageContribution> result = adminService.getAllImageContributions();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getId()).isEqualTo("image123");
            verify(imageContributionOutputPort).findAll();
        }

        @Test
        @DisplayName("Should get pending image contributions")
        void shouldGetPendingImageContributions() {
            // Given
            List<ImageContribution> pendingContributions = Arrays.asList(sampleImageContribution);
            when(imageContributionOutputPort.findByStatus("PENDING"))
                    .thenReturn(pendingContributions);

            // When
            List<ImageContribution> result = adminService.getPendingImageContributions();

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getStatus()).isEqualTo("PENDING");
            verify(imageContributionOutputPort).findByStatus("PENDING");
        }

        @Test
        @DisplayName("Should approve image contribution successfully")
        void shouldApproveImageContributionSuccessfully() {
            // Given
            when(imageContributionOutputPort.findById("image123"))
                    .thenReturn(Optional.of(sampleImageContribution));
            when(imageContributionOutputPort.save(any(ImageContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            ImageContribution result = adminService.approveImageContribution("image123");

            // Then
            assertThat(result.getStatus()).isEqualTo("APPROVED");
            verify(imageContributionOutputPort).save(any(ImageContribution.class));
        }

        @Test
        @DisplayName("Should reject image contribution with reason")
        void shouldRejectImageContributionWithReason() {
            // Given
            String rejectionReason = "Poor image quality";
            when(imageContributionOutputPort.findById("image123"))
                    .thenReturn(Optional.of(sampleImageContribution));
            when(imageContributionOutputPort.save(any(ImageContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            ImageContribution result = adminService.rejectImageContribution("image123", rejectionReason);

            // Then
            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(result.getValidationMessage()).isEqualTo(rejectionReason);
            verify(imageContributionOutputPort).save(any(ImageContribution.class));
        }

        @Test
        @DisplayName("Should throw exception when image contribution not found for approval")
        void shouldThrowExceptionWhenImageContributionNotFoundForApproval() {
            // Given
            when(imageContributionOutputPort.findById("nonexistent"))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.approveImageContribution("nonexistent"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Image contribution not found: nonexistent");
        }

        @Test
        @DisplayName("Should throw exception when image contribution not found for rejection")
        void shouldThrowExceptionWhenImageContributionNotFoundForRejection() {
            // Given
            when(imageContributionOutputPort.findById("nonexistent"))
                    .thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> adminService.rejectImageContribution("nonexistent", "reason"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Image contribution not found: nonexistent");
        }

        @Test
        @DisplayName("Should delete image contribution")
        void shouldDeleteImageContribution() {
            // When
            adminService.deleteImageContribution("image123");

            // Then
            verify(imageContributionOutputPort).deleteById("image123");
        }

        @Test
        @DisplayName("Should handle empty pending image contributions list")
        void shouldHandleEmptyPendingImageContributionsList() {
            // Given
            when(imageContributionOutputPort.findByStatus("PENDING"))
                    .thenReturn(Collections.emptyList());

            // When
            List<ImageContribution> result = adminService.getPendingImageContributions();

            // Then
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCasesAndErrorHandling {

        @Test
        @DisplayName("Should handle null rejection reason gracefully")
        void shouldHandleNullRejectionReasonGracefully() {
            // Given
            when(routeContributionPort.findRouteContributionById("route123"))
                    .thenReturn(Optional.of(sampleRouteContribution));
            when(routeContributionPort.saveRouteContribution(any(RouteContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            RouteContribution result = adminService.rejectRouteContribution("route123", null);

            // Then
            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(result.getValidationMessage()).isNull();
        }

        @Test
        @DisplayName("Should handle empty rejection reason")
        void shouldHandleEmptyRejectionReason() {
            // Given
            when(routeContributionPort.findRouteContributionById("route123"))
                    .thenReturn(Optional.of(sampleRouteContribution));
            when(routeContributionPort.saveRouteContribution(any(RouteContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            RouteContribution result = adminService.rejectRouteContribution("route123", "");

            // Then
            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(result.getValidationMessage()).isEmpty();
        }

        @Test
        @DisplayName("Should handle very long rejection reason")
        void shouldHandleVeryLongRejectionReason() {
            // Given
            String longReason = "A".repeat(1000); // Very long reason
            when(routeContributionPort.findRouteContributionById("route123"))
                    .thenReturn(Optional.of(sampleRouteContribution));
            when(routeContributionPort.saveRouteContribution(any(RouteContribution.class)))
                    .thenAnswer(invocation -> invocation.getArgument(0));

            // When
            RouteContribution result = adminService.rejectRouteContribution("route123", longReason);

            // Then
            assertThat(result.getStatus()).isEqualTo("REJECTED");
            assertThat(result.getValidationMessage()).isEqualTo(longReason);
        }
    }
}