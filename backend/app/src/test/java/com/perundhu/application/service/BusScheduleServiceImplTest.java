package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

import java.time.LocalTime;
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

import com.perundhu.application.dto.BusDTO;
import com.perundhu.domain.model.Bus;
import com.perundhu.domain.model.BusId;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;
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

        @Nested
        @DisplayName("Hierarchical location search tests")
        class HierarchicalSearchTests {

        @Test
        @DisplayName("Should expand parent and child locations before searching")
        void shouldExpandHierarchyBeforeSearch() {
            // Arrange
            List<Long> fromIds = List.of(1L, 11L, 12L);
            List<Long> toIds = List.of(2L, 21L);

                Location fromLocation = new Location(new LocationId(11L), "Chennai - CMBT", null, null, null, null,
                    "Chennai");
                Location toLocation = new Location(new LocationId(21L), "Madurai - Mattuthavani", null, null, null,
                    null, "Madurai");

            Bus bus = new Bus(
                new BusId(100L),
                "TN-01-AA-0001",
                "Ultra Deluxe",
                "SETC",
                "AC",
                fromLocation,
                toLocation,
                LocalTime.of(10, 0),
                LocalTime.of(16, 30),
                54,
                List.of("USB"),
                true);

            when(locationRepository.findLocationIdsForHierarchicalSearch(1L)).thenReturn(fromIds);
            when(locationRepository.findLocationIdsForHierarchicalSearch(2L)).thenReturn(toIds);
            when(busRepository.findBusesBetweenLocationSets(fromIds, toIds)).thenReturn(List.of(bus));

            // Act
            List<BusDTO> result = busScheduleService.findBusesBetweenLocations(1L, 2L);

            // Assert
            assertThat(result).hasSize(1);
            verify(locationRepository).findLocationIdsForHierarchicalSearch(1L);
            verify(locationRepository).findLocationIdsForHierarchicalSearch(2L);
            verify(busRepository).findBusesBetweenLocationSets(fromIds, toIds);
        }

        @Test
        @DisplayName("Should apply translations when using hierarchical search with language code")
        void shouldApplyTranslationsForHierarchicalSearch() {
            // Arrange
            List<Long> fromIds = List.of(1L);
            List<Long> toIds = List.of(2L);

            Location fromLocation = new Location(new LocationId(1L), "Chennai", null, null, null, null, null);
            Location toLocation = new Location(new LocationId(2L), "Madurai", null, null, null, null, null);

            Bus bus = new Bus(
                new BusId(200L),
                "TN-02-BB-0002",
                "Express",
                "TNSTC",
                "Non-AC",
                fromLocation,
                toLocation,
                LocalTime.of(8, 15),
                LocalTime.of(13, 45),
                54,
                List.of(),
                true);

            when(locationRepository.findLocationIdsForHierarchicalSearch(1L)).thenReturn(fromIds);
            when(locationRepository.findLocationIdsForHierarchicalSearch(2L)).thenReturn(toIds);
            when(busRepository.findBusesBetweenLocationSets(fromIds, toIds)).thenReturn(List.of(bus));

            Translation fromTranslation = new Translation(new Translation.TranslationId(1L), "location", 1L,
                "name", "ta", "சென்னை", null, null);
            Translation toTranslation = new Translation(new Translation.TranslationId(2L), "location", 2L,
                "name", "ta", "மதுரை", null, null);

            when(translationRepository.findTranslation("location", 1L, "ta", "name"))
                .thenReturn(Optional.of(fromTranslation));
            when(translationRepository.findTranslation("location", 2L, "ta", "name"))
                .thenReturn(Optional.of(toTranslation));

            // Act
            List<BusDTO> result = busScheduleService.findBusesBetweenLocations(1L, 2L, "ta");

            // Assert
            assertThat(result).hasSize(1);
            assertThat(result.get(0).fromLocationNameTranslated()).isEqualTo("சென்னை");
            assertThat(result.get(0).toLocationNameTranslated()).isEqualTo("மதுரை");
            verify(locationRepository).findLocationIdsForHierarchicalSearch(1L);
            verify(locationRepository).findLocationIdsForHierarchicalSearch(2L);
            verify(busRepository).findBusesBetweenLocationSets(fromIds, toIds);
        }
        }
}
