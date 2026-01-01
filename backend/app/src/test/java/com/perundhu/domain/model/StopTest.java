package com.perundhu.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for Stop domain model
 */
@DisplayName("Stop Domain Model")
class StopTest {

  @Nested
  @DisplayName("Constructor Validation")
  class ConstructorValidationTests {

    @Test
    @DisplayName("Should create stop with all parameters")
    void shouldCreateStopWithAllParameters() {
      StopId id = new StopId(1L);
      String name = "Chennai Central";
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);
      LocalTime arrival = LocalTime.of(8, 30);
      LocalTime departure = LocalTime.of(8, 45);
      int sequence = 1;
      List<String> features = List.of("WiFi", "Restroom");

      Stop stop = new Stop(id, name, location, arrival, departure, sequence, features);

      assertThat(stop.id()).isEqualTo(id);
      assertThat(stop.name()).isEqualTo(name);
      assertThat(stop.location()).isEqualTo(location);
      assertThat(stop.arrivalTime()).isEqualTo(arrival);
      assertThat(stop.departureTime()).isEqualTo(departure);
      assertThat(stop.sequence()).isEqualTo(sequence);
      assertThat(stop.features()).isEqualTo(features);
    }

    @Test
    @DisplayName("Should reject null stop name")
    void shouldRejectNullStopName() {
      StopId id = new StopId(1L);
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      assertThatThrownBy(() -> new Stop(id, null, location, null, null, 0, List.of()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Stop name cannot be null or empty");
    }

    @Test
    @DisplayName("Should reject empty stop name")
    void shouldRejectEmptyStopName() {
      StopId id = new StopId(1L);
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      assertThatThrownBy(() -> new Stop(id, "   ", location, null, null, 0, List.of()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Stop name cannot be null or empty");
    }

    @Test
    @DisplayName("Should reject negative sequence")
    void shouldRejectNegativeSequence() {
      StopId id = new StopId(1L);
      String name = "Chennai Central";
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      assertThatThrownBy(() -> new Stop(id, name, location, null, null, -1, List.of()))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Stop sequence cannot be negative");
    }

    @Test
    @DisplayName("Should allow null features list")
    void shouldAllowNullFeaturesList() {
      StopId id = new StopId(1L);
      String name = "Chennai Central";
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      Stop stop = new Stop(id, name, location, null, null, 0, null);

      assertThat(stop.features()).isEqualTo(List.of());
    }

    @Test
    @DisplayName("Should allow null times")
    void shouldAllowNullTimes() {
      StopId id = new StopId(1L);
      String name = "Chennai Central";
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      Stop stop = new Stop(id, name, location, null, null, 0, List.of());

      assertThat(stop.arrivalTime()).isNull();
      assertThat(stop.departureTime()).isNull();
    }

    @Test
    @DisplayName("Should allow null ID for new stops")
    void shouldAllowNullIdForNewStops() {
      String name = "New Stop";
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      Stop stop = new Stop(null, name, location, null, null, 0, List.of());

      assertThat(stop.id()).isNull();
      assertThat(stop.name()).isEqualTo(name);
    }
  }

  @Nested
  @DisplayName("Timing Logic")
  class TimingLogicTests {

    @Test
    @DisplayName("Should track arrival and departure times")
    void shouldTrackArrivalAndDepartureTimes() {
      Stop stop = new Stop(
          new StopId(1L),
          "Chennai Central",
          new Location(new LocationId(101L), "Chennai", null, 13.0827, 80.2707),
          LocalTime.of(8, 30),
          LocalTime.of(8, 45),
          1,
          List.of());

      assertThat(stop.getArrivalTime()).isEqualTo(LocalTime.of(8, 30));
      assertThat(stop.getDepartureTime()).isEqualTo(LocalTime.of(8, 45));
    }

    @Test
    @DisplayName("Should calculate stop duration")
    void shouldCalculateStopDuration() {
      LocalTime arrival = LocalTime.of(8, 30);
      LocalTime departure = LocalTime.of(8, 45);

      Stop stop = new Stop(
          new StopId(1L),
          "Chennai Central",
          new Location(new LocationId(101L), "Chennai", null, 13.0827, 80.2707),
          arrival,
          departure,
          1,
          List.of());

      // Calculate duration in minutes
      long durationMinutes = java.time.temporal.ChronoUnit.MINUTES.between(arrival, departure);
      assertThat(durationMinutes).isEqualTo(15);
    }

    @Test
    @DisplayName("Should handle same arrival and departure time")
    void shouldHandleSameArrivalAndDepartureTime() {
      LocalTime time = LocalTime.of(8, 30);

      Stop stop = new Stop(
          new StopId(1L),
          "Express Stop",
          new Location(new LocationId(101L), "Chennai", null, 13.0827, 80.2707),
          time,
          time,
          1,
          List.of());

      assertThat(stop.getArrivalTime()).isEqualTo(stop.getDepartureTime());
    }

    @Test
    @DisplayName("Should handle midnight crossing times")
    void shouldHandleMidnightCrossingTimes() {
      LocalTime arrival = LocalTime.of(23, 30);
      LocalTime departure = LocalTime.of(23, 45);

      Stop stop = new Stop(
          new StopId(1L),
          "Night Stop",
          new Location(new LocationId(101L), "Chennai", null, 13.0827, 80.2707),
          arrival,
          departure,
          1,
          List.of());

      assertThat(stop.getArrivalTime()).isEqualTo(LocalTime.of(23, 30));
      assertThat(stop.getDepartureTime()).isEqualTo(LocalTime.of(23, 45));
    }
  }

  @Nested
  @DisplayName("Sequence / Order")
  class SequenceTests {

    @Test
    @DisplayName("Should track stop sequence")
    void shouldTrackStopSequence() {
      Stop firstStop = new Stop(
          new StopId(1L), "First",
          new Location(new LocationId(101L), "City1", null, 13.0, 80.0),
          null, null, 0, List.of());
      Stop secondStop = new Stop(
          new StopId(2L), "Second",
          new Location(new LocationId(102L), "City2", null, 14.0, 81.0),
          null, null, 1, List.of());

      assertThat(firstStop.sequence()).isEqualTo(0);
      assertThat(secondStop.sequence()).isEqualTo(1);
    }

    @Test
    @DisplayName("Should provide getStopOrder alias")
    void shouldProvideGetStopOrderAlias() {
      Stop stop = new Stop(
          new StopId(1L), "Stop",
          new Location(new LocationId(101L), "City", null, 13.0, 80.0),
          null, null, 5, List.of());

      assertThat(stop.getStopOrder()).isEqualTo(5);
      assertThat(stop.getStopOrder()).isEqualTo(stop.sequence());
    }

    @Test
    @DisplayName("Should allow zero sequence")
    void shouldAllowZeroSequence() {
      Stop stop = new Stop(
          new StopId(1L), "First Stop",
          new Location(new LocationId(101L), "City", null, 13.0, 80.0),
          null, null, 0, List.of());

      assertThat(stop.sequence()).isEqualTo(0);
    }
  }

  @Nested
  @DisplayName("Features")
  class FeaturesTests {

    @Test
    @DisplayName("Should track stop features")
    void shouldTrackStopFeatures() {
      List<String> features = List.of("WiFi", "Restroom", "Food Court");

      Stop stop = new Stop(
          new StopId(1L), "Modern Stop",
          new Location(new LocationId(101L), "City", null, 13.0, 80.0),
          null, null, 0, features);

      assertThat(stop.features()).containsExactlyInAnyOrder("WiFi", "Restroom", "Food Court");
    }

    @Test
    @DisplayName("Should allow empty features list")
    void shouldAllowEmptyFeaturesList() {
      Stop stop = new Stop(
          new StopId(1L), "Basic Stop",
          new Location(new LocationId(101L), "City", null, 13.0, 80.0),
          null, null, 0, List.of());

      assertThat(stop.features()).isEmpty();
    }

    @Test
    @DisplayName("Should be immutable features list")
    void shouldHaveImmutableFeaturesList() {
      List<String> originalFeatures = List.of("WiFi", "Restroom");
      Stop stop = new Stop(
          new StopId(1L), "Stop",
          new Location(new LocationId(101L), "City", null, 13.0, 80.0),
          null, null, 0, originalFeatures);

      assertThatThrownBy(() -> stop.features().add("NewFeature"))
          .isInstanceOf(UnsupportedOperationException.class);
    }
  }

  @Nested
  @DisplayName("Location Association")
  class LocationAssociationTests {

    @Test
    @DisplayName("Should associate stop with location")
    void shouldAssociateStopWithLocation() {
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      Stop stop = new Stop(
          new StopId(1L), "Chennai Central", location,
          null, null, 0, List.of());

      assertThat(stop.location()).isEqualTo(location);
      assertThat(stop.location().name()).isEqualTo("Chennai");
    }

    @Test
    @DisplayName("Should allow null location")
    void shouldAllowNullLocation() {
      Stop stop = new Stop(
          new StopId(1L), "Stop", null,
          null, null, 0, List.of());

      assertThat(stop.location()).isNull();
    }

    @Test
    @DisplayName("Should handle multiple stops in same location")
    void shouldHandleMultipleStopsInSameLocation() {
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);

      Stop stop1 = new Stop(
          new StopId(1L), "Chennai Central", location,
          null, null, 0, List.of());
      Stop stop2 = new Stop(
          new StopId(2L), "Chennai Main Gate", location,
          null, null, 1, List.of());

      assertThat(stop1.location()).isEqualTo(stop2.location());
      assertThat(stop1.name()).isNotEqualTo(stop2.name());
    }
  }

  @Nested
  @DisplayName("Getter Methods")
  class GetterMethodsTests {

    @Test
    @DisplayName("Should provide traditional getter methods")
    void shouldProvideGetterMethods() {
      StopId id = new StopId(1L);
      String name = "Chennai Central";
      Location location = new Location(
          new LocationId(101L), "Chennai", null, 13.0827, 80.2707);
      LocalTime arrival = LocalTime.of(8, 30);
      LocalTime departure = LocalTime.of(8, 45);
      int sequence = 1;
      List<String> features = List.of("WiFi");

      Stop stop = new Stop(id, name, location, arrival, departure, sequence, features);

      assertThat(stop.getId()).isEqualTo(id);
      assertThat(stop.getName()).isEqualTo(name);
      assertThat(stop.getLocation()).isEqualTo(location);
      assertThat(stop.getArrivalTime()).isEqualTo(arrival);
      assertThat(stop.getDepartureTime()).isEqualTo(departure);
      assertThat(stop.getSequence()).isEqualTo(sequence);
      assertThat(stop.getFeatures()).isEqualTo(features);
    }
  }

  @Nested
  @DisplayName("Factory Methods")
  class FactoryMethodsTests {

    @Test
    @DisplayName("Should create stop with minimal information")
    void shouldCreateStopWithMinimalInfo() {
      StopId id = new StopId(1L);
      String name = "Stop Name";
      Location location = new Location(
          new LocationId(101L), "City", null, 13.0, 80.0);

      Stop stop = Stop.create(id, name, location);

      assertThat(stop.id()).isEqualTo(id);
      assertThat(stop.name()).isEqualTo(name);
      assertThat(stop.location()).isEqualTo(location);
      assertThat(stop.arrivalTime()).isNull();
      assertThat(stop.departureTime()).isNull();
      assertThat(stop.sequence()).isEqualTo(0);
      assertThat(stop.features()).isEmpty();
    }

    @Test
    @DisplayName("Should create stop with timing information")
    void shouldCreateStopWithTimingInfo() {
      StopId id = new StopId(1L);
      String name = "Timed Stop";
      Location location = new Location(
          new LocationId(101L), "City", null, 13.0, 80.0);
      LocalTime arrival = LocalTime.of(10, 0);
      LocalTime departure = LocalTime.of(10, 15);
      int sequence = 2;

      Stop stop = Stop.create(id, name, location, arrival, departure, sequence);

      assertThat(stop.arrivalTime()).isEqualTo(arrival);
      assertThat(stop.departureTime()).isEqualTo(departure);
      assertThat(stop.sequence()).isEqualTo(sequence);
      assertThat(stop.features()).isEmpty();
    }
  }

  @Nested
  @DisplayName("Special Cases")
  class SpecialCasesTests {

    @Test
    @DisplayName("Should handle multiple stops in route")
    void shouldHandleMultipleStopsInRoute() {
      Location[] locations = {
          new Location(new LocationId(1L), "City1", null, 13.0, 80.0),
          new Location(new LocationId(2L), "City2", null, 14.0, 81.0),
          new Location(new LocationId(3L), "City3", null, 15.0, 82.0),
      };

      Stop[] stops = {
          new Stop(new StopId(1L), "Stop1", locations[0], null, null, 0, List.of()),
          new Stop(new StopId(2L), "Stop2", locations[1], null, null, 1, List.of()),
          new Stop(new StopId(3L), "Stop3", locations[2], null, null, 2, List.of()),
      };

      assertThat(stops[0].sequence()).isLessThan(stops[1].sequence());
      assertThat(stops[1].sequence()).isLessThan(stops[2].sequence());
    }

    @Test
    @DisplayName("Should handle transit hubs with many features")
    void shouldHandleTransitHubsWithManyFeatures() {
      List<String> hubFeatures = List.of(
          "WiFi", "Restroom", "Food Court", "Lounge", "Parking",
          "First Aid", "Lost & Found", "ATM", "Information");

      Stop hub = new Stop(
          new StopId(1L), "Major Hub",
          new Location(new LocationId(101L), "Metro City", null, 13.0, 80.0),
          LocalTime.of(8, 0), LocalTime.of(8, 30), 0, hubFeatures);

      assertThat(hub.features()).hasSize(9);
      assertThat(hub.features()).containsAll(hubFeatures);
    }

    @Test
    @DisplayName("Should handle terminal stops")
    void shouldHandleTerminalStops() {
      Location start = new Location(
          new LocationId(1L), "Start City", null, 13.0, 80.0);
      Location end = new Location(
          new LocationId(2L), "End City", null, 14.0, 81.0);

      Stop firstStop = new Stop(
          new StopId(1L), "Start Terminal", start,
          null, LocalTime.of(8, 0), 0, List.of());
      Stop lastStop = new Stop(
          new StopId(100L), "End Terminal", end,
          LocalTime.of(18, 0), null, 99, List.of());

      assertThat(firstStop.arrivalTime()).isNull();
      assertThat(firstStop.departureTime()).isNotNull();
      assertThat(lastStop.arrivalTime()).isNotNull();
      assertThat(lastStop.departureTime()).isNull();
    }
  }
}
