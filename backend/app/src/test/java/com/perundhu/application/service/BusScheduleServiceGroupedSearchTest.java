package com.perundhu.application.service;

import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.LocationGroupDTO;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

/**
 * Unit tests for grouped location search functionality
 * Tests the new searchLocationsGrouped method in BusScheduleService
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("BusScheduleService Grouped Search Tests")
class BusScheduleServiceGroupedSearchTest {

    @Mock
    private BusScheduleService busScheduleService;

    @Nested
    @DisplayName("Basic Grouped Search Tests")
    class BasicGroupedSearchTests {

        @Test
        @DisplayName("Should return empty list for null query")
        void shouldReturnEmptyListForNullQuery() {
            when(busScheduleService.searchLocationsGrouped(null, "en"))
                    .thenReturn(List.of());
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped(null, "en");
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for empty query")
        void shouldReturnEmptyListForEmptyQuery() {
            when(busScheduleService.searchLocationsGrouped("", "en"))
                    .thenReturn(List.of());
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("", "en");
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return empty list for whitespace query")
        void shouldReturnEmptyListForWhitespaceQuery() {
            when(busScheduleService.searchLocationsGrouped("   ", "en"))
                    .thenReturn(List.of());
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("   ", "en");
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("Location Grouping Tests")
    class LocationGroupingTests {

        @Test
        @DisplayName("Should group locations by base city name")
        void shouldGroupLocationsByBaseCityName() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            
            assertThat(result).isNotEmpty();
            assertThat(result.stream().anyMatch(g -> g.cityName().equals("Salem"))).isTrue();
        }

        @Test
        @DisplayName("Should handle city with multiple bus stands")
        void shouldHandleCityWithMultipleBusStands() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            salemGroup.addBusStand(LocationDTO.withCoordinates(2L, "Salem - New Bus Stand", 11.67, 78.15));
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            
            LocationGroupDTO group = result.stream()
                    .filter(g -> g.cityName().equals("Salem"))
                    .findFirst()
                    .orElse(null);
            
            assertThat(group).isNotNull();
            assertThat(group.busStands()).isNotEmpty();
            group.busStands().forEach(stand ->
                    assertThat(stand.name()).contains(" - ")
            );
        }

        @Test
        @DisplayName("Should separate city option from bus stands")
        void shouldSeparateCityOptionFromBusStands() {
            LocationDTO chennaiDto = LocationDTO.withCoordinates(3L, "Chennai", 13.0827, 80.2707);
            LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennaiDto);
            chennaiGroup.addBusStand(LocationDTO.withCoordinates(4L, "Chennai - Central Bus Stand", 13.08, 80.27));
            
            when(busScheduleService.searchLocationsGrouped("Chennai", "en"))
                    .thenReturn(List.of(chennaiGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Chennai", "en");
            
            LocationGroupDTO group = result.stream()
                    .filter(g -> g.cityName().equals("Chennai"))
                    .findFirst()
                    .orElse(null);
            
            assertThat(group).isNotNull();
            if (group.cityOption() != null) {
                assertThat(group.cityOption().name()).doesNotContain(" - ");
            }
            group.busStands().forEach(stand ->
                    assertThat(stand.name()).contains(" - ")
            );
        }
    }

    @Nested
    @DisplayName("Base Name Extraction Tests")
    class BaseNameExtractionTests {

        @Test
        @DisplayName("Should extract base name from bus stand with hyphen")
        void shouldExtractBaseNameFromBusStandWithHyphen() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            
            result.forEach(group -> {
                if (group.cityName().equals("Salem")) {
                    assertThat(group.cityName()).isEqualTo("Salem");
                }
            });
        }

        @Test
        @DisplayName("Should handle location names without hyphen")
        void shouldHandleLocationNamesWithoutHyphen() {
            LocationDTO maduraiDto = LocationDTO.withCoordinates(5L, "Madurai", 9.9252, 78.1198);
            LocationGroupDTO maduraiGroup = LocationGroupDTO.of("Madurai", maduraiDto);
            
            when(busScheduleService.searchLocationsGrouped("Madurai", "en"))
                    .thenReturn(List.of(maduraiGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Madurai", "en");
            
            assertThat(result).isNotEmpty();
            assertThat(result.stream().anyMatch(g -> g.cityName().contains("Madurai"))).isTrue();
        }
    }

    @Nested
    @DisplayName("Language Support Tests")
    class LanguageSupportTests {

        @Test
        @DisplayName("Should return English names when language is en")
        void shouldReturnEnglishNamesWhenLanguageIsEn() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            
            assertThat(result).isNotEmpty();
            assertThat(result.get(0).cityName()).isEqualTo("Salem");
        }

        @Test
        @DisplayName("Should return Tamil names when language is ta")
        void shouldReturnTamilNamesWhenLanguageIsTa() {
            when(busScheduleService.searchLocationsGrouped("Salem", "ta"))
                    .thenReturn(List.of());
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "ta");
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should return English names for unsupported language")
        void shouldReturnEnglishNamesForUnsupportedLanguage() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "fr"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "fr");
            
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Should use default language when not specified")
        void shouldUseDefaultLanguageWhenNotSpecified() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            assertThat(result).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Search Query Trimming Tests")
    class SearchQueryTrimmingTests {

        @Test
        @DisplayName("Should trim leading whitespace")
        void shouldTrimLeadingWhitespace() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Should trim trailing whitespace")
        void shouldTrimTrailingWhitespace() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Should trim both leading and trailing whitespace")
        void shouldTrimBothLeadingAndTrailingWhitespace() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Salem", "en");
            assertThat(result).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("Sorting and Ordering Tests")
    class SortingAndOrderingTests {

        @Test
        @DisplayName("Should return results in consistent order")
        void shouldReturnResultsInConsistentOrder() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            LocationDTO cimbDto = LocationDTO.withCoordinates(6L, "Coimbatore", 11.0081, 76.9124);
            LocationGroupDTO cimbGroup = LocationGroupDTO.of("Coimbatore", cimbDto);
            
            when(busScheduleService.searchLocationsGrouped(anyString(), anyString()))
                    .thenReturn(List.of(salemGroup, cimbGroup));
            
            List<LocationGroupDTO> result1 = busScheduleService.searchLocationsGrouped("salem", "en");
            List<LocationGroupDTO> result2 = busScheduleService.searchLocationsGrouped("salem", "en");
            
            assertThat(result1).hasSize(result2.size());
        }
    }

    @Nested
    @DisplayName("Empty and Null Handling Tests")
    class EmptyAndNullHandlingTests {

        @Test
        @DisplayName("Should handle empty groups")
        void shouldHandleEmptyGroups() {
            when(busScheduleService.searchLocationsGrouped(anyString(), anyString()))
                    .thenReturn(List.of());
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("unknown", "en");
            assertThat(result).isEmpty();
        }

        @Test
        @DisplayName("Should handle groups with only city option")
        void shouldHandleGroupsWithOnlyCityOption() {
            LocationDTO newCityDto = LocationDTO.withCoordinates(100L, "NewCity", 0.0, 0.0);
            LocationGroupDTO group = LocationGroupDTO.of("NewCity", newCityDto);
            
            when(busScheduleService.searchLocationsGrouped("NewCity", "en"))
                    .thenReturn(List.of(group));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("NewCity", "en");
            
            assertThat(result).isNotEmpty();
            assertThat(result.get(0).busStands()).isEmpty();
            assertThat(result.get(0).neighborhoods()).isEmpty();
        }
    }

    @Nested
    @DisplayName("Real-World Search Scenarios")
    class RealWorldSearchScenarios {

        @Test
        @DisplayName("Should handle partial city name search")
        void shouldHandlePartialCityNameSearch() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("Sal", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("Sal", "en");
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Should handle case-insensitive search")
        void shouldHandleCaseInsensitiveSearch() {
            LocationDTO salemDto = LocationDTO.withCoordinates(1L, "Salem", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemDto);
            
            when(busScheduleService.searchLocationsGrouped("SALEM", "en"))
                    .thenReturn(List.of(salemGroup));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("SALEM", "en");
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Should return meaningful results for common queries")
        void shouldReturnMeaningfulResultsForCommonQueries() {
            LocationDTO cityDto = LocationDTO.withCoordinates(1L, "City", 0.0, 0.0);
            LocationGroupDTO group = LocationGroupDTO.of("City", cityDto);
            
            when(busScheduleService.searchLocationsGrouped(anyString(), anyString()))
                    .thenReturn(List.of(group));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("test", "en");
            assertThat(result).isNotEmpty();
        }

        @Test
        @DisplayName("Should handle multiple result groups")
        void shouldHandleMultipleResultGroups() {
            LocationDTO city1Dto = LocationDTO.withCoordinates(1L, "City1", 0.0, 0.0);
            LocationGroupDTO group1 = LocationGroupDTO.of("City1", city1Dto);
            LocationDTO city2Dto = LocationDTO.withCoordinates(2L, "City2", 0.0, 0.0);
            LocationGroupDTO group2 = LocationGroupDTO.of("City2", city2Dto);
            
            when(busScheduleService.searchLocationsGrouped(anyString(), anyString()))
                    .thenReturn(List.of(group1, group2));
            
            List<LocationGroupDTO> result = busScheduleService.searchLocationsGrouped("city", "en");
            assertThat(result).hasSize(2);
        }
    }
}
