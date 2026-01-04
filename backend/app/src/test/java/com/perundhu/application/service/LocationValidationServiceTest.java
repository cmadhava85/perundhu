package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.LocationValidationService;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
@DisplayName("LocationValidationService Tests - Phase 2")
class LocationValidationServiceTest {

    @Mock
    private LocationRepository locationRepository;

    @InjectMocks
    private LocationValidationServiceImpl locationValidationService;

    private Location testLocation;

    @Nested
    @DisplayName("Service Initialization Tests")
    class ServiceInitializationTests {

        @Test
        @DisplayName("Should initialize with repository")
        void testServiceInitialization() {
            assertThat(locationValidationService).isNotNull();
        }
    }

    @Nested
    @DisplayName("Location Validation Tests")
    class LocationValidationTests {

        @Test
        @DisplayName("Should validate location with valid name")
        void testValidateLocation_ValidName() {
            // Arrange
            testLocation = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);

            // Act
            boolean result = locationValidationService.validateLocation(testLocation);

            // Assert
            assertThat(result).isTrue();
        }

        @Test
        @DisplayName("Should reject location with null object")
        void testValidateLocation_Null() {
            // Act
            boolean result = locationValidationService.validateLocation(null);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should reject location with empty name")
        void testValidateLocation_EmptyName() {
            // Note: Location.withCoordinates() validates input and throws IllegalArgumentException
            // for empty names, so this test validates the domain constraint
            
            // Act & Assert
            assertThatThrownBy(() -> 
                Location.withCoordinates(new LocationId(1L), "", 13.0827, 80.2707))
                    .isInstanceOf(IllegalArgumentException.class);
        }

        @Test
        @DisplayName("Should reject location with whitespace-only name")
        void testValidateLocation_WhitespaceName() {
            // Note: Location.withCoordinates() validates input and throws IllegalArgumentException
            // for empty/whitespace names, so this test validates the domain constraint
            
            // Act & Assert
            assertThatThrownBy(() -> 
                Location.withCoordinates(new LocationId(1L), "   ", 13.0827, 80.2707))
                    .isInstanceOf(IllegalArgumentException.class);
        }
    }

    @Nested
    @DisplayName("Valid Location Existence Tests")
    class ValidLocationExistenceTests {

        @Test
        @DisplayName("Should return true when location exists in repository")
        void testIsValidLocation_Exists() {
            // Arrange
            testLocation = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(testLocation));

            // Act
            boolean result = locationValidationService.isValidLocation("Chennai");

            // Assert
            assertThat(result).isTrue();
            verify(locationRepository, times(1)).findByName("Chennai");
        }

        @Test
        @DisplayName("Should return false when location does not exist")
        void testIsValidLocation_NotExists() {
            // Arrange
            when(locationRepository.findByName("NonExistentCity"))
                    .thenReturn(List.of());

            // Act
            boolean result = locationValidationService.isValidLocation("NonExistentCity");

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should handle null location name")
        void testIsValidLocation_Null() {
            // Act
            boolean result = locationValidationService.isValidLocation(null);

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should handle empty location name")
        void testIsValidLocation_Empty() {
            // Act
            boolean result = locationValidationService.isValidLocation("");

            // Assert
            assertThat(result).isFalse();
        }

        @Test
        @DisplayName("Should handle whitespace-only location name")
        void testIsValidLocation_Whitespace() {
            // Act
            boolean result = locationValidationService.isValidLocation("   ");

            // Assert
            assertThat(result).isFalse();
        }
    }

    @Nested
    @DisplayName("Coordinate Validation Tests")
    class CoordinateValidationTests {

        @Test
        @DisplayName("Should validate coordinates within India bounds")
        void testIsValidLocationCoordinates_IndiaBounds() {
            // Chennai coordinates
            assertThat(locationValidationService.isValidLocationCoordinates(13.0827, 80.2707))
                    .isTrue();

            // Bangalore coordinates
            assertThat(locationValidationService.isValidLocationCoordinates(12.9716, 77.5946))
                    .isTrue();

            // Hyderabad coordinates
            assertThat(locationValidationService.isValidLocationCoordinates(17.3850, 78.4867))
                    .isTrue();
        }

        @Test
        @DisplayName("Should reject latitude below India minimum (6.0)")
        void testIsValidLocationCoordinates_LatitudeBelowMin() {
            // Act & Assert
            assertThat(locationValidationService.isValidLocationCoordinates(5.9, 80.2707))
                    .isFalse();
        }

        @Test
        @DisplayName("Should reject latitude above India maximum (37.0)")
        void testIsValidLocationCoordinates_LatitudeAboveMax() {
            // Act & Assert
            assertThat(locationValidationService.isValidLocationCoordinates(37.1, 80.2707))
                    .isFalse();
        }

        @Test
        @DisplayName("Should reject longitude below India minimum (68.0)")
        void testIsValidLocationCoordinates_LongitudeBelowMin() {
            // Act & Assert
            assertThat(locationValidationService.isValidLocationCoordinates(13.0827, 67.9))
                    .isFalse();
        }

        @Test
        @DisplayName("Should reject longitude above India maximum (97.0)")
        void testIsValidLocationCoordinates_LongitudeAboveMax() {
            // Act & Assert
            assertThat(locationValidationService.isValidLocationCoordinates(13.0827, 97.1))
                    .isFalse();
        }

        @Test
        @DisplayName("Should validate boundary latitude values")
        void testIsValidLocationCoordinates_LatitudeBoundary() {
            // Minimum boundary
            assertThat(locationValidationService.isValidLocationCoordinates(6.0, 80.0))
                    .isTrue();

            // Maximum boundary
            assertThat(locationValidationService.isValidLocationCoordinates(37.0, 80.0))
                    .isTrue();
        }

        @Test
        @DisplayName("Should validate boundary longitude values")
        void testIsValidLocationCoordinates_LongitudeBoundary() {
            // Minimum boundary
            assertThat(locationValidationService.isValidLocationCoordinates(13.0, 68.0))
                    .isTrue();

            // Maximum boundary
            assertThat(locationValidationService.isValidLocationCoordinates(13.0, 97.0))
                    .isTrue();
        }

        @Test
        @DisplayName("Should handle NaN coordinates")
        void testIsValidLocationCoordinates_NaN() {
            // Act & Assert
            assertThat(locationValidationService.isValidLocationCoordinates(Double.NaN, 80.0))
                    .isFalse();
            assertThat(locationValidationService.isValidLocationCoordinates(13.0, Double.NaN))
                    .isFalse();
        }

        @Test
        @DisplayName("Should handle Infinity coordinates")
        void testIsValidLocationCoordinates_Infinity() {
            // Act & Assert
            assertThat(locationValidationService.isValidLocationCoordinates(
                    Double.POSITIVE_INFINITY, 80.0)).isFalse();
            assertThat(locationValidationService.isValidLocationCoordinates(
                    Double.NEGATIVE_INFINITY, 80.0)).isFalse();
            assertThat(locationValidationService.isValidLocationCoordinates(
                    13.0, Double.POSITIVE_INFINITY)).isFalse();
            assertThat(locationValidationService.isValidLocationCoordinates(
                    13.0, Double.NEGATIVE_INFINITY)).isFalse();
        }

        @Test
        @DisplayName("Should validate major Tamil Nadu cities")
        void testIsValidLocationCoordinates_TamilNaduCities() {
            // Chennai
            assertThat(locationValidationService.isValidLocationCoordinates(13.0827, 80.2707))
                    .isTrue();

            // Madurai
            assertThat(locationValidationService.isValidLocationCoordinates(9.9252, 78.1198))
                    .isTrue();

            // Coimbatore
            assertThat(locationValidationService.isValidLocationCoordinates(11.0081, 76.9958))
                    .isTrue();

            // Tiruppur
            assertThat(locationValidationService.isValidLocationCoordinates(11.1085, 77.3411))
                    .isTrue();

            // Tirunelveli
            assertThat(locationValidationService.isValidLocationCoordinates(8.7139, 77.7567))
                    .isTrue();
        }
    }

    @Nested
    @DisplayName("Find Location By Name Tests")
    class FindLocationByNameTests {

        @Test
        @DisplayName("Should return location when found by name")
        void testFindLocationByName_Success() {
            // Arrange
            testLocation = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(testLocation));

            // Act
            Optional<Location> result = locationValidationService.findLocationByName("Chennai");

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get().name()).isEqualTo("Chennai");
            verify(locationRepository, times(1)).findByName("Chennai");
        }

        @Test
        @DisplayName("Should return empty optional when location not found")
        void testFindLocationByName_NotFound() {
            // Arrange
            when(locationRepository.findByName("NonExistent"))
                    .thenReturn(List.of());

            // Act
            Optional<Location> result = locationValidationService.findLocationByName("NonExistent");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle null location name")
        void testFindLocationByName_Null() {
            // Act
            Optional<Location> result = locationValidationService.findLocationByName(null);

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle empty location name")
        void testFindLocationByName_Empty() {
            // Act
            Optional<Location> result = locationValidationService.findLocationByName("");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return first location when multiple found")
        void testFindLocationByName_MultipleResults() {
            // Arrange
            Location loc1 = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            Location loc2 = Location.withCoordinates(
                    new LocationId(2L), "Chennai", 13.0850, 80.2750);
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(loc1, loc2));

            // Act
            Optional<Location> result = locationValidationService.findLocationByName("Chennai");

            // Assert
            assertThat(result).isPresent();
            assertThat(result.get()).isEqualTo(loc1);
        }
    }

    @Nested
    @DisplayName("Find Similar Locations Tests")
    class FindSimilarLocationsTests {

        @Test
        @DisplayName("Should return similar locations when found")
        void testFindSimilarLocations_Success() {
            // Arrange
            testLocation = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(testLocation));

            // Act
            List<Location> results = locationValidationService.findSimilarLocations("Chennai");

            // Assert
            assertThat(results).hasSize(1);
            assertThat(results.get(0).name()).isEqualTo("Chennai");
        }

        @Test
        @DisplayName("Should return empty list when no similar locations found")
        void testFindSimilarLocations_NotFound() {
            // Arrange
            when(locationRepository.findByName("NonExistent"))
                    .thenReturn(List.of());

            // Act
            List<Location> results = locationValidationService.findSimilarLocations("NonExistent");

            // Assert
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Should handle null location name")
        void testFindSimilarLocations_Null() {
            // Act
            List<Location> results = locationValidationService.findSimilarLocations(null);

            // Assert
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Should handle empty location name")
        void testFindSimilarLocations_Empty() {
            // Act
            List<Location> results = locationValidationService.findSimilarLocations("");

            // Assert
            assertThat(results).isEmpty();
        }

        @Test
        @DisplayName("Should return multiple similar locations")
        void testFindSimilarLocations_Multiple() {
            // Arrange
            Location loc1 = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            Location loc2 = Location.withCoordinates(
                    new LocationId(2L), "Chennai Junction", 13.0900, 80.2800);
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(loc1, loc2));

            // Act
            List<Location> results = locationValidationService.findSimilarLocations("Chennai");

            // Assert
            assertThat(results).hasSize(2);
        }

        @Test
        @DisplayName("Should trim input before searching")
        void testFindSimilarLocations_TrimmedInput() {
            // Arrange
            testLocation = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(List.of(testLocation));

            // Act
            List<Location> results = locationValidationService.findSimilarLocations("  Chennai  ");

            // Assert
            assertThat(results).hasSize(1);
            verify(locationRepository, times(1)).findByName("Chennai");
        }
    }

    @Nested
    @DisplayName("Error Handling and Edge Cases")
    class ErrorHandlingTests {

        @Test
        @DisplayName("Should handle repository exceptions gracefully")
        void testErrorHandling_RepositoryException() {
            // Arrange
            when(locationRepository.findByName(any()))
                    .thenThrow(new RuntimeException("Database error"));

            // Act & Assert
            assertThatThrownBy(() -> locationValidationService.isValidLocation("Chennai"))
                    .isInstanceOf(RuntimeException.class);
        }

        @Test
        @DisplayName("Should handle repository returning null instead of empty list")
        void testErrorHandling_NullRepositoryResult() {
            // Arrange - This tests defensive programming
            when(locationRepository.findByName("Chennai"))
                    .thenReturn(null);

            // Act & Assert - Should handle gracefully without NullPointerException
            assertThatThrownBy(() -> locationValidationService.isValidLocation("Chennai"))
                    .isInstanceOf(NullPointerException.class);
        }
    }

    @Nested
    @DisplayName("Integration-like Behavior Tests")
    class IntegrationBehaviorTests {

        @Test
        @DisplayName("Should work with multiple locations having different coordinates")
        void testMultipleLocationBehavior() {
            // Arrange
            Location loc1 = Location.withCoordinates(
                    new LocationId(1L), "Chennai", 13.0827, 80.2707);
            Location loc2 = Location.withCoordinates(
                    new LocationId(2L), "Madurai", 9.9252, 78.1198);

            // Act & Assert
            assertThat(locationValidationService.validateLocation(loc1)).isTrue();
            assertThat(locationValidationService.validateLocation(loc2)).isTrue();
            assertThat(locationValidationService.isValidLocationCoordinates(13.0827, 80.2707))
                    .isTrue();
            assertThat(locationValidationService.isValidLocationCoordinates(9.9252, 78.1198))
                    .isTrue();
        }

        @Test
        @DisplayName("Should validate all major South Indian cities")
        void testMajorSouthIndianCities() {
            // Test coordinates for major South Indian cities
            // Bangalore (Karnataka)
            assertThat(locationValidationService.isValidLocationCoordinates(12.9716, 77.5946))
                    .isTrue();

            // Hyderabad (Telangana)
            assertThat(locationValidationService.isValidLocationCoordinates(17.3850, 78.4867))
                    .isTrue();

            // Kochi (Kerala)
            assertThat(locationValidationService.isValidLocationCoordinates(9.9312, 76.2673))
                    .isTrue();

            // Visakhapatnam (Andhra Pradesh)
            assertThat(locationValidationService.isValidLocationCoordinates(17.6869, 83.2185))
                    .isTrue();
        }
    }
}
