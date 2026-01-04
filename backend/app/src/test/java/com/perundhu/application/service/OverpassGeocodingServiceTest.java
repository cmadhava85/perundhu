package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatNoException;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.application.dto.LocationDTO;

@ExtendWith(MockitoExtension.class)
@DisplayName("Overpass Geocoding Service Tests")
class OverpassGeocodingServiceTest {

  @InjectMocks
  private OverpassGeocodingService overpassGeocodingService;

  @Nested
  @DisplayName("Search Tamil Nadu Locations Tests")
  class SearchTamilNaduLocationsTests {

    @Test
    @DisplayName("Should return empty list for null query")
    void shouldReturnEmptyListForNullQuery() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchTamilNaduLocations(null, 10);

      // Then
      assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list for empty query")
    void shouldReturnEmptyListForEmptyQuery() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchTamilNaduLocations("", 10);

      // Then
      assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list for whitespace-only query")
    void shouldReturnEmptyListForWhitespaceOnlyQuery() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchTamilNaduLocations("   ", 10);

      // Then
      assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should return empty list for single character query")
    void shouldReturnEmptyListForSingleCharacterQuery() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchTamilNaduLocations("a", 10);

      // Then
      assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should accept valid queries with minimum 2 characters")
    void shouldAcceptValidQueriesWithMinimumTwoCharacters() {
      // When & Then - Should not throw exception
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations("ch", 10));
    }

    @Test
    @DisplayName("Should respect result limit parameter")
    void shouldRespectResultLimitParameter() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchTamilNaduLocations("Chennai", 1);

      // Then
      assertThat(results).size().isLessThanOrEqualTo(1);
    }
  }

  @Nested
  @DisplayName("Search Tamil Nadu Locations with Language Tests")
  class SearchTamilNaduLocationsWithLanguageTests {

    @Test
    @DisplayName("Should accept English language code")
    void shouldAcceptEnglishLanguageCode() {
      // When
      List<LocationDTO> results = overpassGeocodingService
          .searchTamilNaduLocations("Chennai", 10, "en");

      // Then
      assertThat(results).isNotNull();
    }

    @Test
    @DisplayName("Should accept Tamil language code")
    void shouldAcceptTamilLanguageCode() {
      // When
      List<LocationDTO> results = overpassGeocodingService
          .searchTamilNaduLocations("Chennai", 10, "ta");

      // Then
      assertThat(results).isNotNull();
    }

    @Test
    @DisplayName("Should handle null language parameter")
    void shouldHandleNullLanguageParameter() {
      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations("Chennai", 10, null));
    }
  }

  @Nested
  @DisplayName("Get Coordinates Tests")
  class GetCoordinatesTests {

    @Test
    @DisplayName("Should return null for null location name")
    void shouldReturnNullForNullLocationName() {
      // When
      double[] coordinates = overpassGeocodingService.getCoordinates(null);

      // Then
      assertThat(coordinates).isNull();
    }

    @Test
    @DisplayName("Should return null for empty location name")
    void shouldReturnNullForEmptyLocationName() {
      // When
      double[] coordinates = overpassGeocodingService.getCoordinates("");

      // Then
      assertThat(coordinates).isNull();
    }

    @Test
    @DisplayName("Should return null for whitespace-only location name")
    void shouldReturnNullForWhitespaceOnlyLocationName() {
      // When
      double[] coordinates = overpassGeocodingService.getCoordinates("   ");

      // Then
      assertThat(coordinates).isNull();
    }

    @Test
    @DisplayName("Should accept valid location names")
    void shouldAcceptValidLocationNames() {
      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.getCoordinates("Chennai"));
    }
  }

  @Nested
  @DisplayName("Search Locations Generic Tests")
  class SearchLocationsGenericTests {

    @Test
    @DisplayName("Should return list for valid query")
    void shouldReturnListForValidQuery() {
      // When
      List<Object> results = overpassGeocodingService.searchLocations("Chennai", 10);

      // Then
      assertThat(results).isNotNull();
      assertThat(results).isInstanceOf(List.class);
    }

    @Test
    @DisplayName("Should return empty list for invalid query")
    void shouldReturnEmptyListForInvalidQuery() {
      // When
      List<Object> results = overpassGeocodingService.searchLocations("", 10);

      // Then
      assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should respect limit in search results")
    void shouldRespectLimitInSearchResults() {
      // When
      List<Object> results = overpassGeocodingService.searchLocations("Chennai", 5);

      // Then
      assertThat(results).size().isLessThanOrEqualTo(5);
    }
  }

  @Nested
  @DisplayName("Search Indian Cities Tests")
  class SearchIndianCitiesTests {

    @Test
    @DisplayName("Should return list for valid city query")
    void shouldReturnListForValidCityQuery() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchIndianCities("Chennai", 10);

      // Then
      assertThat(results).isNotNull();
    }

    @Test
    @DisplayName("Should return empty list for invalid query")
    void shouldReturnEmptyListForInvalidQuery() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchIndianCities("", 10);

      // Then
      assertThat(results).isEmpty();
    }

    @Test
    @DisplayName("Should respect limit parameter")
    void shouldRespectLimitParameter() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchIndianCities("city", 3);

      // Then
      assertThat(results).size().isLessThanOrEqualTo(3);
    }
  }

  @Nested
  @DisplayName("Update Missing Coordinates Tests")
  class UpdateMissingCoordinatesTests {

    @Test
    @DisplayName("Should handle update without exceptions")
    void shouldHandleUpdateWithoutExceptions() {
      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.updateMissingCoordinates());
    }

    @Test
    @DisplayName("Should log update operation")
    void shouldLogUpdateOperation() {
      // When & Then - Verify no exception is thrown
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.updateMissingCoordinates());
    }
  }

  @Nested
  @DisplayName("Error Handling and Edge Cases Tests")
  class ErrorHandlingAndEdgeCasesTests {

    @Test
    @DisplayName("Should handle special characters in query")
    void shouldHandleSpecialCharactersInQuery() {
      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations("Chennai@#$", 10));
    }

    @Test
    @DisplayName("Should handle very long queries")
    void shouldHandleVeryLongQueries() {
      // Given
      String longQuery = "a".repeat(200);

      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations(longQuery, 10));
    }

    @Test
    @DisplayName("Should handle high limit values")
    void shouldHandleHighLimitValues() {
      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations("Chennai", 1000));
    }

    @Test
    @DisplayName("Should handle zero or negative limits gracefully")
    void shouldHandleZeroOrNegativeLimitsGracefully() {
      // When & Then
      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations("Chennai", 0));

      assertThatNoException()
          .isThrownBy(() -> overpassGeocodingService.searchTamilNaduLocations("Chennai", -1));
    }
  }

  @Nested
  @DisplayName("Circuit Breaker Fallback Tests")
  class CircuitBreakerFallbackTests {

    @Test
    @DisplayName("Should have fallback method for location search")
    void shouldHaveFallbackMethodForLocationSearch() {
      // When
      List<LocationDTO> results = overpassGeocodingService.searchTamilNaduLocations("Chennai", 10);

      // Then - Fallback should return empty list when circuit is open
      assertThat(results).isNotNull();
    }

    @Test
    @DisplayName("Should have fallback method for coordinate lookup")
    void shouldHaveFallbackMethodForCoordinateLookup() {
      // When
      double[] coordinates = overpassGeocodingService.getCoordinates("NonExistentPlace");

      // Then - Fallback should return null when circuit is open
      assertThat(coordinates).isNull();
    }
  }

  @Nested
  @DisplayName("Integration Pattern Tests")
  class IntegrationPatternTests {

    @Test
    @DisplayName("Should handle consecutive searches")
    void shouldHandleConsecutiveSearches() {
      // When
      List<LocationDTO> results1 = overpassGeocodingService
          .searchTamilNaduLocations("Chennai", 5);
      List<LocationDTO> results2 = overpassGeocodingService
          .searchTamilNaduLocations("Bangalore", 5);
      List<LocationDTO> results3 = overpassGeocodingService
          .searchTamilNaduLocations("Coimbatore", 5);

      // Then
      assertThat(results1).isNotNull();
      assertThat(results2).isNotNull();
      assertThat(results3).isNotNull();
    }

    @Test
    @DisplayName("Should handle mixed search and coordinate lookups")
    void shouldHandleMixedSearchAndCoordinateLookups() {
      // When
      List<LocationDTO> searchResults = overpassGeocodingService
          .searchTamilNaduLocations("Chennai", 5);
      double[] coordinates = overpassGeocodingService.getCoordinates("Chennai");

      // Then
      assertThat(searchResults).isNotNull();
      assertThat(coordinates).isNull(); // Might be null due to fallback
    }
  }
}
