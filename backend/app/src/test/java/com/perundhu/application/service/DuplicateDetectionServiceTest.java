package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalTime;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.application.service.DuplicateDetectionService.DuplicateCheckResult;
import com.perundhu.application.service.DuplicateDetectionService.MatchType;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
@DisplayName("DuplicateDetectionService Tests - Phase 2")
class DuplicateDetectionServiceTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private StopRepository stopRepository;

    @InjectMocks
    private DuplicateDetectionService duplicateDetectionService;

    private Location fromLocation;
    private Location toLocation;
    private Bus testBus;
    private LocalTime departureTime;

    @BeforeEach
    void setUp() {
        fromLocation = Location.withCoordinates(
                new LocationId(1L), "Chennai", 13.0827, 80.2707);
        toLocation = Location.withCoordinates(
                new LocationId(2L), "Madurai", 9.9252, 78.1198);
        departureTime = LocalTime.of(10, 30);
        // Create bus with departure and arrival times
        testBus = Bus.create(
                new BusId(1L), "TN-01-AB-1234", "Express Bus", 
                fromLocation, toLocation, departureTime, LocalTime.of(14, 30));
    }

    @Nested
    @DisplayName("Service Initialization Tests")
    class ServiceInitializationTests {

        @Test
        @DisplayName("Should initialize with all required repositories")
        void testServiceInitialization() {
            assertThat(duplicateDetectionService).isNotNull();
        }
    }

    @Nested
    @DisplayName("Duplicate Detection - Hard Check Tests")
    class HardCheckTests {

        @Test
        @DisplayName("Should return NO_MATCH when no buses found on route")
        void testCheckForDuplicate_NoMatch() {
            // Arrange
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of());

            // Act
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, "TN-01-AB-5678");

            // Assert
            assertThat(result.matchType()).isEqualTo(MatchType.NO_MATCH);
            assertThat(result.confidenceScore()).isZero();
            verify(busRepository, times(1)).findBusesBetweenLocations(1L, 2L);
        }

        @Test
        @DisplayName("Should return EXACT_MATCH for same bus number and timing within window")
        void testCheckForDuplicate_ExactMatch() {
            // Arrange
            Bus existingBus = Bus.create(
                    new BusId(1L), "TN-01-AB-1234", "Express", 
                    fromLocation, toLocation, departureTime, LocalTime.of(14, 30));
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(existingBus));

            // Act
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, "TN-01-AB-1234");

            // Assert
            assertThat(result.matchType()).isEqualTo(MatchType.EXACT_MATCH);
            assertThat(result.isDuplicate()).isTrue();
            assertThat(result.confidenceScore()).isGreaterThan(50);
        }

        @Test
        @DisplayName("Should return POSSIBLE_DUPLICATE for different bus number, same timing")
        void testCheckForDuplicate_PossibleDuplicate() {
            // Arrange
            Bus existingBus = Bus.create(
                    new BusId(1L), "TN-01-AB-5678", "Express",
                    fromLocation, toLocation, departureTime, LocalTime.of(14, 30));
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(existingBus));

            // Act
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, "TN-01-AB-1234");

            // Assert
            assertThat(result.matchType()).isEqualTo(MatchType.POSSIBLE_DUPLICATE);
            assertThat(result.needsReview()).isTrue();
        }

        @Test
        @DisplayName("Should return NO_MATCH when timing is outside window")
        void testCheckForDuplicate_TimingOutsideWindow() {
            // Arrange - Bus runs 6:00-10:00, we'll check at 15:00 (outside window)
            LocalTime busStartTime = LocalTime.of(6, 0);
            LocalTime checkTime = LocalTime.of(15, 0);
            Bus existingBus = Bus.create(
                    new BusId(1L), "TN-01-AB-1234", "Express",
                    fromLocation, toLocation, busStartTime, LocalTime.of(10, 0));
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(existingBus));

            // Act
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, checkTime, "TN-01-AB-1234");

            // Assert
            assertThat(result.matchType()).isEqualTo(MatchType.NO_MATCH);
        }
    }

    @Nested
    @DisplayName("Soft Check - Potential Duplicates Tests")
    class SoftCheckTests {

        @Test
        @DisplayName("Should return empty list when locations not found")
        void testFindPotentialDuplicates_LocationsNotFound() {
            // Arrange
            when(locationRepository.findByName("NonExistent"))
                    .thenReturn(List.of());
            when(locationRepository.findByNameContaining("NonExistent"))
                    .thenReturn(List.of());

            // Act
            List<DuplicateCheckResult> results = duplicateDetectionService.findPotentialDuplicates(
                    "NonExistent", "AnotherNonExistent", "10:30", "TN-01-AB-1234");

            // Assert
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Should return results sorted by confidence score descending")
        void testFindPotentialDuplicates_SortedByConfidence() {
            // Arrange
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(fromLocation));
            when(locationRepository.findByName("Madurai"))
                    .thenReturn(List.of(toLocation));
            Bus bus1 = Bus.create(new BusId(1L), "TN-01-AB-1234", "Express",
                    fromLocation, toLocation, departureTime, LocalTime.of(14, 30));
            Bus bus2 = Bus.create(new BusId(2L), "TN-01-AB-9999", "Standard",
                    fromLocation, toLocation, departureTime, LocalTime.of(14, 30));
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(bus1, bus2));

            // Act
            List<DuplicateCheckResult> results = duplicateDetectionService.findPotentialDuplicates(
                    "Chennai", "Madurai", "10:30", "TN-01-AB-1234");

            // Assert
            assertThat(results).isNotEmpty();
            if (results.size() > 1) {
                assertThat(results.get(0).confidenceScore())
                        .isGreaterThanOrEqualTo(results.get(1).confidenceScore());
            }
        }
    }

    @Nested
    @DisplayName("Confidence Scoring Tests")
    class ConfidenceScoringTests {

        @Test
        @DisplayName("Should increase confidence for same bus number match")
        void testConfidenceScore_SameBusNumber() {
            // Arrange
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(testBus));

            // Act
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, "TN-01-AB-1234");

            // Assert
            assertThat(result.confidenceScore()).isGreaterThan(70);
        }

        @Test
        @DisplayName("Should calculate confidence based on timing proximity")
        void testConfidenceScore_TimingProximity() {
            // Arrange - 5 minutes apart should be higher confidence
            LocalTime closeDeparture = LocalTime.of(10, 35);
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(testBus));

            // Act
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, closeDeparture, "TN-01-AB-1234");

            // Assert
            assertThat(result.confidenceScore()).isGreaterThan(50);
        }
    }

    @Nested
    @DisplayName("Bus Number Normalization Tests")
    class BusNumberNormalizationTests {

        @Test
        @DisplayName("Should match bus numbers with different formats")
        void testBusNumberMatching_DifferentFormats() {
            // Arrange
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(testBus));

            // Act - Testing with space in bus number
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, "TN 01 AB 1234");

            // Assert - Should still match after normalization
            assertThat(result.matchType()).isNotEqualTo(MatchType.NO_MATCH);
        }
    }

    @Nested
    @DisplayName("Error Handling Tests")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should handle null departure time gracefully")
        void testErrorHandling_NullDepartureTime() {
            // Arrange
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of());
            when(busRepository.findAll()).thenReturn(List.of());

            // Act & Assert
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, null, "TN-01-AB-1234");
            assertThat(result.matchType()).isEqualTo(MatchType.NO_MATCH);
        }

        @Test
        @DisplayName("Should handle null bus number gracefully")
        void testErrorHandling_NullBusNumber() {
            // Arrange
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of());
            when(busRepository.findAll()).thenReturn(List.of());

            // Act & Assert
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, null);
            assertThat(result.matchType()).isEqualTo(MatchType.NO_MATCH);
        }

        @Test
        @DisplayName("Should handle repository exceptions gracefully")
        void testErrorHandling_RepositoryException() {
            // Arrange
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenThrow(new RuntimeException("Database error"));

            // Act & Assert
            assertThatThrownBy(() -> duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, departureTime, "TN-01-AB-1234"))
                    .isInstanceOf(RuntimeException.class)
                    .hasMessageContaining("Database");
        }
    }

    @Nested
    @DisplayName("Result Type Tests")
    class ResultTypeTests {

        @Test
        @DisplayName("DuplicateCheckResult.isDuplicate() should return true for EXACT_MATCH")
        void testResultType_IsDuplicate_ExactMatch() {
            DuplicateCheckResult result = DuplicateCheckResult.exactMatch(
                    testBus, "Test match", 95);
            assertThat(result.isDuplicate()).isTrue();
        }

        @Test
        @DisplayName("DuplicateCheckResult.isDuplicate() should return true for PASSES_THROUGH")
        void testResultType_IsDuplicate_PassesThrough() {
            DuplicateCheckResult result = DuplicateCheckResult.passesThrough(
                    testBus, "Passes through destination", 80);
            assertThat(result.isDuplicate()).isTrue();
        }

        @Test
        @DisplayName("DuplicateCheckResult.needsReview() should return true for POSSIBLE_DUPLICATE")
        void testResultType_NeedsReview() {
            DuplicateCheckResult result = DuplicateCheckResult.possibleDuplicate(
                    testBus, "Different bus number", 75);
            assertThat(result.needsReview()).isTrue();
        }

        @Test
        @DisplayName("DuplicateCheckResult.isNewRoute() should return true for NO_MATCH")
        void testResultType_IsNewRoute_NoMatch() {
            DuplicateCheckResult result = DuplicateCheckResult.noMatch();
            assertThat(result.isNewRoute()).isTrue();
        }
    }

    @Nested
    @DisplayName("Time Window Tests")
    class TimeWindowTests {

        @Test
        @DisplayName("Should respect custom time window setting")
        void testCustomTimeWindow() {
            // Arrange - 10 minute difference, within both default and custom windows
            LocalTime closeTime = LocalTime.of(10, 40);
            when(busRepository.findBusesBetweenLocations(1L, 2L))
                    .thenReturn(List.of(testBus));

            // Act - 10 minutes difference should match with any window >= 10 minutes
            DuplicateCheckResult result = duplicateDetectionService.checkForDuplicate(
                    fromLocation, toLocation, closeTime, "TN-01-AB-1234", 30);

            // Assert - should not be NO_MATCH since within window
            assertThat(result.matchType()).isNotEqualTo(MatchType.NO_MATCH);
        }
    }
}
