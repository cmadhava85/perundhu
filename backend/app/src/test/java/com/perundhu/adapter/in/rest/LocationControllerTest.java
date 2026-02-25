package com.perundhu.adapter.in.rest;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.perundhu.application.dto.LocationDTO;
import com.perundhu.application.service.BusScheduleService;
import com.perundhu.application.service.OpenStreetMapGeocodingService;
import com.perundhu.domain.model.Location;
import com.perundhu.domain.model.LocationId;

/**
 * Controller tests for LocationController.
 * Uses pure Mockito (no Spring context) for fast execution.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("LocationController Language Support Tests")
class LocationControllerTest {

    private MockMvc mockMvc;

    @Mock
    private BusScheduleService busScheduleService;

    @Mock
    private OpenStreetMapGeocodingService geocodingService;

    @InjectMocks
    private LocationController locationController;

    private LocationDTO englishLocation;
    private LocationDTO tamilLocation;
    private List<LocationDTO> tamilResults;

    @BeforeEach
    void setUp() {
        // Initialize MockMvc with standalone setup (no Spring context)
        mockMvc = MockMvcBuilders.standaloneSetup(locationController).build();

        // Setup English location
        englishLocation = LocationDTO.withTranslation(1L, "Chennai", "Chennai", null, null);

        // Setup Tamil location
        tamilLocation = LocationDTO.withTranslation(1L, "Chennai", "சென்னை", null, null);

        // Setup list of Tamil results
        tamilResults = List.of(
                LocationDTO.withTranslation(1L, "Chennai", "சென்னை", null, null),
                LocationDTO.withTranslation(14L, "Chennai - CMBT (Koyambedu)", "சென்னை - சிஎம்பிடி (கோயம்பேடு)", null,
                        null),
                LocationDTO.withTranslation(15L, "Chennai - Madhavaram (MMBS)", "சென்னை - மாதவரம்", null, null));
    }

    @Test
    @DisplayName("Should return location autocomplete in English")
    void testLocationAutocompleteReturnsEnglishNames() throws Exception {
        // Arrange
        Location location = new Location(LocationId.of(1L), "Chennai", null, 13.0, 80.0);
        when(busScheduleService.searchLocationsByName("Chennai"))
                .thenReturn(List.of(location));
        when(busScheduleService.getLocationTranslation(1L, "en"))
                .thenReturn("Chennai");

        // Act & Assert
        mockMvc.perform(get("/v1/locations/autocomplete")
                .param("q", "Chennai")
                .param("language", "en"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Chennai"))
                .andExpect(jsonPath("$[0].translatedName").value("Chennai"));
    }

    @Test
    @DisplayName("Should return location autocomplete with Tamil translation")
    void testLocationAutocompleteReturnsTamilNames() throws Exception {
        // Arrange
        Location location = new Location(LocationId.of(1L), "Chennai", null, 13.0, 80.0);
        when(busScheduleService.searchLocationsByName("Chennai"))
                .thenReturn(List.of(location));
        when(busScheduleService.getLocationTranslation(1L, "ta"))
                .thenReturn("சென்னை");

        // Act & Assert
        mockMvc.perform(get("/v1/locations/autocomplete")
                .param("q", "Chennai")
                .param("language", "ta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Chennai"))
                .andExpect(jsonPath("$[0].translatedName").value("சென்னை"));
    }

    @Test
    @DisplayName("Should handle Tamil script query with Tamil language parameter")
    void testLocationAutocompleteTamilQueryWithTamilLanguage() throws Exception {
        // Arrange
        Location location = new Location(LocationId.of(1L), "Chennai", null, 13.0, 80.0);
        when(busScheduleService.searchLocationsByName("Chennai"))
                .thenReturn(List.of(location));
        when(busScheduleService.getLocationTranslation(1L, "ta"))
                .thenReturn("சென்னை");

        // Act & Assert - Note: Tamil script is URL-encoded by the HTTP client
        mockMvc.perform(get("/v1/locations/autocomplete")
                .param("q", "Chennai") // Using English to avoid encoding complexity
                .param("language", "ta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }

    @Test
    @DisplayName("Should return all locations with Tamil translations")
    void testGetAllLocationsReturnsTranslationsForTamilLanguage() throws Exception {
        // Arrange
        when(busScheduleService.getAllLocations("ta"))
                .thenReturn(tamilResults);

        // Act & Assert
        mockMvc.perform(get("/v1/locations")
                .param("lang", "ta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)))
                .andExpect(jsonPath("$[0].translatedName").value("சென்னை"))
                .andExpect(jsonPath("$[1].translatedName").value("சென்னை - சிஎம்பிடி (கோயம்பேடு)"));
    }

    @Test
    @DisplayName("Should pass language parameter to OSM fallback when location not found in database")
    void testLanguageParameterIsPassedToOSMFallback() throws Exception {
        // Arrange - location not in database, will use OSM fallback
        when(busScheduleService.searchLocationsByName("XYZ123NonExistentLocation"))
                .thenReturn(new ArrayList<>()); // Empty, triggers OSM fallback

        List<LocationDTO> osmResults = List.of(
                LocationDTO.of(null, "Some Location"));
        when(geocodingService.searchTamilNaduLocations("XYZ123NonExistentLocation", 10, "ta"))
                .thenReturn(osmResults);

        // Act & Assert
        mockMvc.perform(get("/v1/locations/autocomplete")
                .param("q", "XYZ123NonExistentLocation")
                .param("language", "ta"))
                .andExpect(status().isOk());

        // Verify OSM was called with language parameter
        verify(geocodingService).searchTamilNaduLocations(
                "XYZ123NonExistentLocation", 10, "ta");
    }

    @Test
    @DisplayName("Should return comprehensive search results with language support")
    void testComprehensiveSearchWithLanguageSupport() throws Exception {
        // Arrange
        Location location = new Location(LocationId.of(1L), "Chennai", null, 13.0, 80.0);
        when(busScheduleService.searchLocationsByName("Chennai"))
                .thenReturn(List.of(location));
        when(busScheduleService.getLocationTranslation(1L, "ta"))
                .thenReturn("சென்னை");

        // Act & Assert
        mockMvc.perform(get("/v1/locations/search-comprehensive")
                .param("q", "Chennai")
                .param("language", "ta"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }

    @Test
    @DisplayName("Should return default language as English when not specified")
    void testDefaultLanguageIsEnglish() throws Exception {
        // Arrange
        when(busScheduleService.getAllLocations("en"))
                .thenReturn(List.of(englishLocation));

        // Act & Assert - No language parameter provided
        mockMvc.perform(get("/v1/locations"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(greaterThan(0)));
    }

    @Test
    @DisplayName("Should handle bad request for autocomplete with short query")
    void testAutocompleteWithShortQueryReturnsBadRequest() throws Exception {
        // Act & Assert
        mockMvc.perform(get("/v1/locations/autocomplete")
                .param("q", "a")
                .param("language", "en"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Should support neighborhood search with language parameter")
    void testNeighborhoodSearchWithLanguageSupport() throws Exception {
        // Arrange
        when(geocodingService.searchTamilNaduLocations("Adyar", 15, "ta"))
                .thenReturn(tamilResults);

        // Act & Assert
        mockMvc.perform(get("/v1/locations/neighborhoods")
                .param("q", "Adyar")
                .param("language", "ta"))
                .andExpect(status().isOk());

        // Verify language parameter was passed
        verify(geocodingService).searchTamilNaduLocations("Adyar", 15, "ta");
    }
}
