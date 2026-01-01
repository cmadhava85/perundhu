package com.perundhu.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for Location domain model
 */
@DisplayName("Location Domain Model")
class LocationTest {

  @Nested
  @DisplayName("Constructor Validation")
  class ConstructorValidationTests {

    @Test
    @DisplayName("Should create location with valid parameters")
    void shouldCreateLocationWithValidParameters() {
      LocationId id = new LocationId(1L);
      String name = "Chennai";
      String nameLocal = "சென்னை";
      Double latitude = 13.0827;
      Double longitude = 80.2707;

      Location location = new Location(id, name, nameLocal, latitude, longitude);

      assertThat(location.id()).isEqualTo(id);
      assertThat(location.name()).isEqualTo(name);
      assertThat(location.nameLocalLanguage()).isEqualTo(nameLocal);
      assertThat(location.latitude()).isEqualTo(latitude);
      assertThat(location.longitude()).isEqualTo(longitude);
    }

    @Test
    @DisplayName("Should reject null name")
    void shouldRejectNullName() {
      LocationId id = new LocationId(1L);

      assertThatThrownBy(() -> new Location(id, null, "Name", 13.0, 80.0)).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Location name cannot be null or empty");
    }

    @Test
    @DisplayName("Should reject empty name")
    void shouldRejectEmptyName() {
      LocationId id = new LocationId(1L);

      assertThatThrownBy(() -> new Location(id, "   ", "Name", 13.0, 80.0)).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Location name cannot be null or empty");
    }

    @Test
    @DisplayName("Should allow null local language name")
    void shouldAllowNullLocalLanguageName() {
      LocationId id = new LocationId(1L);

      Location location = new Location(id, "Chennai", null, 13.0, 80.0);

      assertThat(location.nameLocalLanguage()).isNull();
    }

    @Test
    @DisplayName("Should allow null coordinates")
    void shouldAllowNullCoordinates() {
      LocationId id = new LocationId(1L);

      Location location = new Location(id, "Chennai", null, null, null);

      assertThat(location.latitude()).isNull();
      assertThat(location.longitude()).isNull();
    }

    @Test
    @DisplayName("Should create location with district and nearby city")
    void shouldCreateLocationWithDistrict() {
      LocationId id = new LocationId(1L);

      Location location = new Location(
          id, "Kanchipuram", null, 12.8342, 79.7029,
          "Kanchipuram", "Chennai");

      assertThat(location.district()).isEqualTo("Kanchipuram");
      assertThat(location.nearbyCity()).isEqualTo("Chennai");
    }
  }

  @Nested
  @DisplayName("Coordinate Validation")
  class CoordinateValidationTests {

    @Test
    @DisplayName("Should validate valid coordinates")
    void shouldValidateValidCoordinates() {
      Location location = new Location(
          new LocationId(1L), "Test", null, 0.0, 0.0);

      assertThat(location.hasValidCoordinates()).isTrue();
    }

    @Test
    @DisplayName("Should validate latitude range [-90, 90]")
    void shouldValidateLatitudeRange() {
      Location validNorth = new Location(
          new LocationId(1L), "North", null, 90.0, 0.0);
      Location validSouth = new Location(
          new LocationId(2L), "South", null, -90.0, 0.0);

      assertThat(validNorth.hasValidCoordinates()).isTrue();
      assertThat(validSouth.hasValidCoordinates()).isTrue();
    }

    @Test
    @DisplayName("Should validate longitude range [-180, 180]")
    void shouldValidateLongitudeRange() {
      Location validEast = new Location(
          new LocationId(1L), "East", null, 0.0, 180.0);
      Location validWest = new Location(
          new LocationId(2L), "West", null, 0.0, -180.0);

      assertThat(validEast.hasValidCoordinates()).isTrue();
      assertThat(validWest.hasValidCoordinates()).isTrue();
    }

    @Test
    @DisplayName("Should handle partial coordinates")
    void shouldHandlePartialCoordinates() {
      Location onlyLat = new Location(
          new LocationId(1L), "OnlyLat", null, 13.0, null);
      Location onlyLng = new Location(
          new LocationId(2L), "OnlyLng", null, null, 80.0);
      Location noCoords = new Location(
          new LocationId(3L), "NoCoords", null, null, null);

      assertThat(onlyLat.hasValidCoordinates()).isFalse();
      assertThat(onlyLng.hasValidCoordinates()).isFalse();
      assertThat(noCoords.hasValidCoordinates()).isFalse();
    }
  }

  @Nested
  @DisplayName("Disambiguation")
  class DisambiguationTests {

    @Test
    @DisplayName("Should require disambiguation when near major city")
    void shouldRequireDisambiguationWithNearbyCity() {
      Location location = new Location(
          new LocationId(1L), "Bangalore", null, 12.9716, 77.5946,
          "Bangalore", "Bangalore");

      assertThat(location.needsDisambiguation()).isTrue();
    }

    @Test
    @DisplayName("Should require disambiguation with district info")
    void shouldRequireDisambiguationWithDistrict() {
      Location location = new Location(
          new LocationId(1L), "Salem", null, 11.7673, 78.1357,
          "Salem", null);

      assertThat(location.needsDisambiguation()).isTrue();
    }

    @Test
    @DisplayName("Should not require disambiguation without context")
    void shouldNotRequireDisambiguationWithoutContext() {
      Location location = new Location(
          new LocationId(1L), "Unique City", null, 13.0, 80.0,
          null, null);

      assertThat(location.needsDisambiguation()).isFalse();
    }

    @Test
    @DisplayName("Should return proper display name with disambiguation")
    void shouldReturnDisplayNameWithDisambiguation() {
      Location location = new Location(
          new LocationId(1L), "Bangalore", null, 12.9716, 77.5946,
          "Bangalore", "Bangalore City");

      assertThat(location.getDisplayName())
          .isEqualTo("Bangalore (near Bangalore City)");
    }

    @Test
    @DisplayName("Should return display name with district")
    void shouldReturnDisplayNameWithDistrict() {
      Location location = new Location(
          new LocationId(1L), "Salem", null, 11.7673, 78.1357,
          "Salem District", null);

      assertThat(location.getDisplayName())
          .isEqualTo("Salem, Salem District");
    }

    @Test
    @DisplayName("Should prefer nearby city in display name")
    void shouldPreferNearbyCityInDisplayName() {
      Location location = new Location(
          new LocationId(1L), "Village", null, 13.0, 80.0,
          "District", "Chennai");

      assertThat(location.getDisplayName())
          .isEqualTo("Village (near Chennai)");
    }
  }

  @Nested
  @DisplayName("Getter Methods")
  class GetterMethodsTests {

    @Test
    @DisplayName("Should provide traditional getter methods")
    void shouldProvideGetterMethods() {
      LocationId id = new LocationId(1L);
      String name = "Chennai";
      String nameLocal = "சென்னை";
      Double latitude = 13.0827;
      Double longitude = 80.2707;
      String district = "Chennai";
      String nearbyCity = "Chennai";

      Location location = new Location(
          id, name, nameLocal, latitude, longitude, district, nearbyCity);

      assertThat(location.getId()).isEqualTo(id);
      assertThat(location.getName()).isEqualTo(name);
      assertThat(location.getNameLocalLanguage()).isEqualTo(nameLocal);
      assertThat(location.getLatitude()).isEqualTo(latitude);
      assertThat(location.getLongitude()).isEqualTo(longitude);
      assertThat(location.getDistrict()).isEqualTo(district);
      assertThat(location.getNearbyCity()).isEqualTo(nearbyCity);
    }
  }

  @Nested
  @DisplayName("Entity ID / Type")
  class EntityIdentityTests {

    @Test
    @DisplayName("Should return entity ID")
    void shouldReturnEntityId() {
      LocationId id = new LocationId(42L);
      Location location = new Location(id, "Test", null, 0.0, 0.0);

      assertThat(location.getEntityId()).isEqualTo("42");
    }

    @Test
    @DisplayName("Should return entity type")
    void shouldReturnEntityType() {
      Location location = new Location(
          new LocationId(1L), "Test", null, 0.0, 0.0);

      assertThat(location.getEntityType()).isEqualTo("LOCATION");
    }

    @Test
    @DisplayName("Should handle null ID in entity ID")
    void shouldHandleNullIdInEntityId() {
      Location location = new Location(null, "Test", null, 0.0, 0.0);

      assertThat(location.getEntityId()).isNull();
    }
  }

  @Nested
  @DisplayName("Factory Methods")
  class FactoryMethodsTests {

    @Test
    @DisplayName("Should create location reference by ID")
    void shouldCreateLocationReference() {
      Location location = Location.reference(123L);

      assertThat(location.getId().value()).isEqualTo(123L);
      assertThat(location.getName()).isEqualTo("Reference");
      assertThat(location.hasValidCoordinates()).isFalse();
    }

    @Test
    @DisplayName("Should create location with coordinates")
    void shouldCreateLocationWithCoordinates() {
      LocationId id = new LocationId(1L);
      Location location = Location.withCoordinates(id, "Chennai", 13.0827, 80.2707);

      assertThat(location.id()).isEqualTo(id);
      assertThat(location.name()).isEqualTo("Chennai");
      assertThat(location.latitude()).isEqualTo(13.0827);
      assertThat(location.longitude()).isEqualTo(80.2707);
      assertThat(location.hasValidCoordinates()).isTrue();
    }

    @Test
    @DisplayName("Should create location with district info")
    void shouldCreateLocationWithDistrict() {
      LocationId id = new LocationId(1L);
      Location location = Location.withDistrict(
          id, "Salem", 11.7673, 78.1357, "Salem", "Salem City");

      assertThat(location.id()).isEqualTo(id);
      assertThat(location.district()).isEqualTo("Salem");
      assertThat(location.nearbyCity()).isEqualTo("Salem City");
      assertThat(location.needsDisambiguation()).isTrue();
    }
  }

  @Nested
  @DisplayName("Special Cases")
  class SpecialCasesTests {

    @Test
    @DisplayName("Should handle duplicate village names")
    void shouldHandleDuplicateVillageNames() {
      Location village1 = new Location(
          new LocationId(1L), "Pune", null, 18.5204, 73.8567,
          "Pune", "Pune City");
      Location village2 = new Location(
          new LocationId(2L), "Pune", null, 12.9716, 77.5946,
          "Bangalore", "Bangalore City");

      assertThat(village1.getName()).isEqualTo(village2.getName());
      assertThat(village1.getDisplayName()).isNotEqualTo(village2.getDisplayName());
    }

    @Test
    @DisplayName("Should handle international date line")
    void shouldHandleInternationalDateLine() {
      Location eastOfLine = new Location(
          new LocationId(1L), "Fiji", null, -17.7134, 178.065, null, null);
      Location westOfLine = new Location(
          new LocationId(2L), "Tonga", null, -21.1789, -175.1982, null, null);

      assertThat(eastOfLine.hasValidCoordinates()).isTrue();
      assertThat(westOfLine.hasValidCoordinates()).isTrue();
    }

    @Test
    @DisplayName("Should handle polar coordinates")
    void shouldHandlePolarCoordinates() {
      Location northPole = new Location(
          new LocationId(1L), "North Pole", null, 90.0, 0.0);
      Location southPole = new Location(
          new LocationId(2L), "South Pole", null, -90.0, 0.0);

      assertThat(northPole.hasValidCoordinates()).isTrue();
      assertThat(southPole.hasValidCoordinates()).isTrue();
    }
  }
}
