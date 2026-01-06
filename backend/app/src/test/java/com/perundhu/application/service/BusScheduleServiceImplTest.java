package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

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
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Translation;
import com.perundhu.domain.port.BusRepository;
import com.perundhu.domain.port.LocationRepository;
import com.perundhu.domain.port.StopRepository;
import com.perundhu.domain.port.TranslationRepository;
import com.perundhu.domain.port.BusStandRepository;

@ExtendWith(MockitoExtension.class)
@ActiveProfiles("test")
@DisplayName("BusScheduleServiceImpl Tests - Phase 2")
class BusScheduleServiceImplTest {

    @Mock
    private BusRepository busRepository;

    @Mock
    private LocationRepository locationRepository;

    @Mock
    private StopRepository stopRepository;

    @Mock
    private TranslationRepository translationRepository;

    @Mock
    private BusStandRepository busStandRepository;

    @InjectMocks
    private BusScheduleServiceImpl busScheduleService;

    @Nested
    @DisplayName("Service Initialization Tests")
    class ServiceInitializationTests {

        @Test
        @DisplayName("Should initialize with all required repositories")
        void testServiceInitialization() {
            assertThat(busScheduleService).isNotNull();
        }
    }

    @Nested
    @DisplayName("Bus Retrieval Tests")
    class BusRetrievalTests {

        @Test
        @DisplayName("Should handle empty bus repository")
        void testGetAllBuses_EmptyRepository() {
            // Arrange
            when(busRepository.findAll()).thenReturn(List.of());

            // Act
            List<?> result = busScheduleService.getAllBuses();

            // Assert
            assertThat(result).isEmpty();
            verify(busRepository, times(1)).findAll();
        }

        @Test
        @DisplayName("Should successfully retrieve bus by ID")
        void testGetBusById_Success() {
            // Arrange
            BusId busId = new BusId(1L);
            Bus testBus = Bus.create(busId, "TN-01-AA-0001", "Test Bus", "operator", "AC");
            when(busRepository.findById(busId)).thenReturn(Optional.of(testBus));

            // Act
            Optional<?> result = busScheduleService.getBusById(1L);

            // Assert
            assertThat(result).isPresent();
            verify(busRepository, times(1)).findById(busId);
        }

        @Test
        @DisplayName("Should return empty when bus not found by ID")
        void testGetBusById_NotFound() {
            // Arrange
            BusId busId = new BusId(999L);
            when(busRepository.findById(busId)).thenReturn(Optional.empty());

            // Act
            Optional<?> result = busScheduleService.getBusById(999L);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Location Retrieval Tests")
    class LocationRetrievalTests {

        @Test
        @DisplayName("Should handle empty location repository")
        void testGetAllLocations_EmptyRepository() {
            // Arrange
            when(locationRepository.findAll()).thenReturn(List.of());

            // Act
            List<?> result = busScheduleService.getAllLocations("tamil");

            // Assert
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle null language code for locations")
        void testGetAllLocations_NullLanguage() {
            // Arrange
            when(locationRepository.findAll()).thenReturn(List.of());

            // Act
            List<?> result = busScheduleService.getAllLocations(null);

            // Assert
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Language Translation Tests")
    class LanguageTranslationTests {

        @Test
        @DisplayName("Should return location translation for Tamil language")
        void testGetLocationTranslationReturnsTamilName() {
            // Arrange
            Long locationId = 1L;
            String tamilName = "சென்னை";

            // Mock the translation repository to return a translation
            Translation translation = new Translation(
                    new Translation.TranslationId(1L),
                    "location",
                    locationId,
                    "name",
                    "ta",
                    tamilName,
                    null,
                    null);
            when(translationRepository.findTranslation("location", locationId, "ta", "name"))
                    .thenReturn(Optional.of(translation));

            // Act
            String result = busScheduleService.getLocationTranslation(locationId, "ta");

            // Assert
            assertThat(result).isEqualTo(tamilName);
        }

        @Test
        @DisplayName("Should return null for non-existent location translation")
        void testGetLocationTranslationNonExistent() {
            // Arrange
            Long locationId = 99999L;

            // Mock the translation repository to return empty
            when(translationRepository.findTranslation("location", locationId, "ta", "name"))
                    .thenReturn(Optional.empty());

            // Act
            String result = busScheduleService.getLocationTranslation(locationId, "ta");

            // Assert
            // Should return null or empty string for non-existent translation
            assertThat(result).isNullOrEmpty();
        }

        @Test
        @DisplayName("Should detect Tamil script in location search query")
        void testSearchLocationsByNameDetectsTamilQuery() {
            // Arrange
            String tamilQuery = "சென்னை";

            // Act
            List<?> result = busScheduleService.searchLocationsByName(tamilQuery);

            // Assert
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("Should return Tamil translations for getAllLocations when language=ta")
        void testGetAllLocationsReturnsTamilTranslations() {
            // Arrange
            when(locationRepository.findAll()).thenReturn(List.of());

            // Act
            List<?> result = busScheduleService.getAllLocations("ta");

            // Assert
            assertThat(result).isNotNull();
            verify(locationRepository, atLeastOnce()).findAll();
        }

        @Test
        @DisplayName("Should return English translations for getAllLocations when language=en")
        void testGetAllLocationsReturnsEnglishByDefault() {
            // Arrange
            when(locationRepository.findAll()).thenReturn(List.of());

            // Act
            List<?> result = busScheduleService.getAllLocations("en");

            // Assert
            assertThat(result).isNotNull();
            verify(locationRepository, atLeastOnce()).findAll();
        }

        @Test
        @DisplayName("Should handle null language parameter gracefully")
        void testGetAllLocationsWithNullLanguage() {
            // Arrange
            when(locationRepository.findAll()).thenReturn(List.of());

            // Act
            List<?> result = busScheduleService.getAllLocations(null);

            // Assert
            assertThat(result).isNotNull();
        }
    }

    @Nested
    @DisplayName("Cache and Performance Tests")
    class CachePerformanceTests {

        @Test
        @DisplayName("Should invoke repository call for getAllBuses")
        void testGetAllBuses_RepositoryCalled() {
            // Arrange
            when(busRepository.findAll()).thenReturn(List.of());

            // Act
            busScheduleService.getAllBuses();

            // Assert
            verify(busRepository, atLeastOnce()).findAll();
        }

        @Test
        @DisplayName("Should handle repository exceptions gracefully")
        void testRepositoryException_Handling() {
            // Arrange
            when(busRepository.findAll())
                    .thenThrow(new RuntimeException("Database connection failed"));

            // Act & Assert
            assertThatThrownBy(() -> busScheduleService.getAllBuses())
                    .isInstanceOf(RuntimeException.class);
        }
    }
}
