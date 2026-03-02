package com.perundhu.adapter.in.rest;

import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.dto.LocationGroupDTO;
import com.perundhu.application.service.BusScheduleService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.ArrayList;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * REST API tests for grouped location autocomplete endpoint.
 * Uses pure Mockito (no Spring context) for fast execution.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("LocationController Grouped Autocomplete API Tests")
class LocationControllerGroupedSearchTest {

        private MockMvc mockMvc;

        @Mock
        private BusScheduleService busScheduleService;

        @InjectMocks
        private LocationController locationController;

        @BeforeEach
        void setUp() {
                mockMvc = MockMvcBuilders.standaloneSetup(locationController).build();
        }

        @Nested
        @DisplayName("GET /api/v1/locations/autocomplete-grouped")
        class AutocompleteGroupedEndpointTests {

                @Test
                @DisplayName("Should return grouped results for valid query")
                void shouldReturnGroupedResultsForValidQuery() throws Exception {
                        // Setup mock data
                        LocationDTO salemCity = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationDTO salemNew = LocationDTO.withTranslation(
                                        2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                                        11.6700, 78.1500);
                        LocationDTO salemOld = LocationDTO.withTranslation(
                                        3L, "Salem - Old Bus Stand", "சேலம் - பழைய பேருந்து நிலையம்",
                                        11.6600, 78.1400);

                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salemCity);
                        salemGroup.addBusStand(salemNew);
                        salemGroup.addBusStand(salemOld);

                        when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                                        .thenReturn(List.of(salemGroup));

                        // Execute request
                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .param("language", "en")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(jsonPath("$", hasSize(1)))
                                        .andExpect(jsonPath("$[0].cityName", is("Salem")))
                                        .andExpect(jsonPath("$[0].cityOption.id", is(1)))
                                        .andExpect(jsonPath("$[0].cityOption.name", is("Salem")))
                                        .andExpect(jsonPath("$[0].busStands", hasSize(2)))
                                        .andExpect(jsonPath("$[0].busStands[0].name", is("Salem - New Bus Stand")))
                                        .andExpect(jsonPath("$[0].busStands[1].name", is("Salem - Old Bus Stand")));
                }

                @Test
                @DisplayName("Should return 400 for query less than 2 characters")
                void shouldReturn400ForQueryLessThan2Characters() throws Exception {
                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "S")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isBadRequest());
                }

                @Test
                @DisplayName("Should return 400 for empty query")
                void shouldReturn400ForEmptyQuery() throws Exception {
                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isBadRequest());
                }

                @Test
                @DisplayName("Should return 400 for whitespace query")
                void shouldReturn400ForWhitespaceQuery() throws Exception {
                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "  ")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isBadRequest());
                }

                @Test
                @DisplayName("Should use default language 'en' when not specified")
                void shouldUseDefaultLanguageEnWhenNotSpecified() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityOption.name", is("Salem")));
                }

                @Test
                @DisplayName("Should support Tamil language parameter")
                void shouldSupportTamilLanguageParameter() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("Salem", "ta"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .param("language", "ta")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityOption.translatedName", is("சேலம்")));
                }

                @Test
                @DisplayName("Should return empty array when no results found")
                void shouldReturnEmptyArrayWhenNoResultsFound() throws Exception {
                        when(busScheduleService.searchLocationsGrouped("XYZ999", "en"))
                                        .thenReturn(new ArrayList<>());

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "XYZ999")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$", hasSize(0)));
                }

                @Test
                @DisplayName("Should trim query parameter")
                void shouldTrimQueryParameter() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "  Salem  ")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$", hasSize(1)));
                }

                @Test
                @DisplayName("Should return 500 when service throws exception")
                void shouldReturn500WhenServiceThrowsException() throws Exception {
                        when(busScheduleService.searchLocationsGrouped(anyString(), anyString()))
                                        .thenThrow(new RuntimeException("Database error"));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isInternalServerError());
                }
        }

        @Nested
        @DisplayName("Response Structure Tests")
        class ResponseStructureTests {

                @Test
                @DisplayName("Should return correct structure with city, bus stands, and neighborhoods")
                void shouldReturnCorrectStructureWithAllCategories() throws Exception {
                        LocationDTO chennaiCity = LocationDTO.withTranslation(
                                        1L, "Chennai", "சென்னை", 13.0827, 80.2707);
                        LocationDTO cmbt = LocationDTO.withTranslation(
                                        2L, "Chennai - CMBT", "சென்னை - சி.எம்.பி.டி",
                                        13.0669, 80.2072);
                        LocationDTO tNagar = LocationDTO.withTranslation(
                                        3L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341);

                        LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennaiCity);
                        chennaiGroup.addBusStand(cmbt);
                        chennaiGroup.addNeighborhood(tNagar);

                        when(busScheduleService.searchLocationsGrouped("Chennai", "en"))
                                        .thenReturn(List.of(chennaiGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Chennai")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityName", is("Chennai")))
                                        .andExpect(jsonPath("$[0].cityOption", notNullValue()))
                                        .andExpect(jsonPath("$[0].busStands", notNullValue()))
                                        .andExpect(jsonPath("$[0].neighborhoods", notNullValue()))
                                        .andExpect(jsonPath("$[0].busStands", hasSize(1)))
                                        .andExpect(jsonPath("$[0].neighborhoods", hasSize(1)));
                }

                @Test
                @DisplayName("Should return multiple groups for multiple cities")
                void shouldReturnMultipleGroupsForMultipleCities() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationDTO madurai = LocationDTO.withTranslation(
                                        2L, "Madurai", "மதுரை", 9.9252, 78.1198);

                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);
                        LocationGroupDTO maduraiGroup = LocationGroupDTO.of("Madurai", madurai);

                        when(busScheduleService.searchLocationsGrouped("ch", "en"))
                                        .thenReturn(List.of(salemGroup, maduraiGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "ch")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$", hasSize(2)))
                                        .andExpect(jsonPath("$[0].cityName", is("Salem")))
                                        .andExpect(jsonPath("$[1].cityName", is("Madurai")));
                }

                @Test
                @DisplayName("Should include location coordinates in response")
                void shouldIncludeLocationCoordinatesInResponse() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityOption.latitude", is(11.6643)))
                                        .andExpect(jsonPath("$[0].cityOption.longitude", is(78.1460)));
                }

                @Test
                @DisplayName("Should include both English and Tamil names")
                void shouldIncludeBothEnglishAndTamilNames() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("Salem", "ta"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .param("language", "ta")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityOption.name", is("Salem")))
                                        .andExpect(jsonPath("$[0].cityOption.translatedName", is("சேலம்")));
                }
        }

        @Nested
        @DisplayName("Edge Case Tests")
        class EdgeCaseTests {

                @Test
                @DisplayName("Should handle group without city option")
                void shouldHandleGroupWithoutCityOption() throws Exception {
                        LocationDTO busStand = LocationDTO.withTranslation(
                                        2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                                        11.6700, 78.1500);
                        LocationGroupDTO group = LocationGroupDTO.of("Salem", null);
                        group.addBusStand(busStand);

                        when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                                        .thenReturn(List.of(group));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityName", is("Salem")))
                                        .andExpect(jsonPath("$[0].cityOption").doesNotExist())
                                        .andExpect(jsonPath("$[0].busStands", hasSize(1)));
                }

                @Test
                @DisplayName("Should handle group with empty bus stands list")
                void shouldHandleGroupWithEmptyBusStandsList() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("Salem", "en"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Salem")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].busStands", hasSize(0)))
                                        .andExpect(jsonPath("$[0].neighborhoods", hasSize(0)));
                }

                @Test
                @DisplayName("Should handle special characters in query")
                void shouldHandleSpecialCharactersInQuery() throws Exception {
                        when(busScheduleService.searchLocationsGrouped("T. Nagar", "en"))
                                        .thenReturn(new ArrayList<>());

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "T. Nagar")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk());
                }

                @Test
                @DisplayName("Should handle Tamil characters in query")
                void shouldHandleTamilCharactersInQuery() throws Exception {
                        LocationDTO salem = LocationDTO.withTranslation(
                                        1L, "Salem", "சேலம்", 11.6643, 78.1460);
                        LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);

                        when(busScheduleService.searchLocationsGrouped("சேலம்", "ta"))
                                        .thenReturn(List.of(salemGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "சேலம்")
                                        .param("language", "ta")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].cityOption.translatedName", is("சேலம்")));
                }
        }

        @Nested
        @DisplayName("Performance and Scalability Tests")
        class PerformanceAndScalabilityTests {

                @Test
                @DisplayName("Should handle large result set")
                void shouldHandleLargeResultSet() throws Exception {
                        List<LocationGroupDTO> largeResultSet = new ArrayList<>();
                        for (int i = 1; i <= 50; i++) {
                                LocationDTO city = LocationDTO.withTranslation(
                                                (long) i, "City" + i, "நகரம்" + i, 10.0 + i * 0.1, 78.0 + i * 0.1);
                                largeResultSet.add(LocationGroupDTO.of("City" + i, city));
                        }

                        when(busScheduleService.searchLocationsGrouped("ch", "en"))
                                        .thenReturn(largeResultSet);

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "ch")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$", hasSize(50)));
                }

                @Test
                @DisplayName("Should handle group with many bus stands")
                void shouldHandleGroupWithManyBusStands() throws Exception {
                        LocationDTO chennai = LocationDTO.withTranslation(
                                        1L, "Chennai", "சென்னை", 13.0827, 80.2707);
                        LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennai);

                        for (int i = 2; i <= 20; i++) {
                                chennaiGroup.addBusStand(LocationDTO.withTranslation(
                                                (long) i, "Chennai - Stand " + i, "சென்னை - நிலையம் " + i,
                                                13.0 + i * 0.01, 80.2 + i * 0.01));
                        }

                        when(busScheduleService.searchLocationsGrouped("Chennai", "en"))
                                        .thenReturn(List.of(chennaiGroup));

                        mockMvc.perform(get("/v1/locations/autocomplete-grouped")
                                        .param("q", "Chennai")
                                        .contentType(MediaType.APPLICATION_JSON))
                                        .andExpect(status().isOk())
                                        .andExpect(jsonPath("$[0].busStands", hasSize(19)));
                }
        }
}
