package com.perundhu.domain.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.time.LocalTime;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.*;

/**
 * Unit tests for Bus domain model
 * Bus record fields: id, number, name, operator, type, fromLocation,
 * toLocation,
 * departureTime, arrivalTime, capacity, features, active
 */
@DisplayName("Bus Domain Model")
class BusTest {

  @Nested
  @DisplayName("Constructor Validation")
  class ConstructorValidationTests {

    @Test
    @DisplayName("Should reject null bus ID")
    void shouldRejectNullBusId() {
      assertThatThrownBy(() -> new Bus(null, "TN-01-AB-1234", "Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of())).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Bus ID cannot be null");
    }

    @Test
    @DisplayName("Should reject null or empty bus number")
    void shouldRejectNullBusNumber() {
      assertThatThrownBy(() -> new Bus(new BusId(1L), null, "Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of())).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Bus number cannot be null or empty");
    }

    @Test
    @DisplayName("Should reject null or empty bus name")
    void shouldRejectNullBusName() {
      assertThatThrownBy(() -> new Bus(new BusId(1L), "TN-01-AB-1234", null, "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of())).isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Bus name cannot be null or empty");
    }

    @Test
    @DisplayName("Should use default capacity if null")
    void shouldUseDefaultCapacity() {
      Bus bus = new Bus(
          new BusId(1L), "TN-01-AB-1234", "Express", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), null, List.of());

      assertThat(bus.capacity()).isEqualTo(50); // Default capacity
    }

    @Test
    @DisplayName("Should activate bus by default")
    void shouldActivateBusByDefault() {
      Bus bus = new Bus(
          new BusId(1L), "TN-01-AB-1234", "Express", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.active()).isTrue();
    }
  }

  @Nested
  @DisplayName("Bus Identification")
  class BusIdentificationTests {

    @Test
    @DisplayName("Should track bus number")
    void shouldTrackBusNumber() {
      Bus bus = new Bus(
          new BusId(1L), "TN-01-AB-1234", "Express", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.number()).isEqualTo("TN-01-AB-1234");
      assertThat(bus.getNumber()).isEqualTo("TN-01-AB-1234");
    }

    @Test
    @DisplayName("Should track bus name")
    void shouldTrackBusName() {
      Bus bus = new Bus(
          new BusId(1L), "BUS-001", "Express Service", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.name()).isEqualTo("Express Service");
      assertThat(bus.getName()).isEqualTo("Express Service");
    }
  }

  @Nested
  @DisplayName("Route Information")
  class RouteInformationTests {

    @Test
    @DisplayName("Should track departure location")
    void shouldTrackDepartureLocation() {
      Location from = new Location(new LocationId(101L), "Chennai", null, 13.0827, 80.2707);
      Bus bus = new Bus(
          new BusId(1L), "BUS-001", "Express", "Op", "Express",
          from, new Location(new LocationId(102L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.fromLocation()).isEqualTo(from);
      assertThat(bus.getFromLocation()).isEqualTo(from);
    }

    @Test
    @DisplayName("Should track arrival location")
    void shouldTrackArrivalLocation() {
      Location to = new Location(new LocationId(102L), "Bangalore", null, 12.9716, 77.5946);
      Bus bus = new Bus(
          new BusId(1L), "BUS-001", "Express", "Op", "Express",
          new Location(new LocationId(101L), "A", null, 13.0, 80.0),
          to, LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.toLocation()).isEqualTo(to);
      assertThat(bus.getToLocation()).isEqualTo(to);
    }
  }

  @Nested
  @DisplayName("Bus Type and Operator")
  class BusTypeAndOperatorTests {

    @Test
    @DisplayName("Should track bus type")
    void shouldTrackBusType() {
      Bus express = new Bus(
          new BusId(1L), "BUS-001", "Express", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      Bus luxury = new Bus(
          new BusId(2L), "BUS-002", "Luxury", "Op", "Luxury",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 40, List.of());

      assertThat(express.type()).isEqualTo("Express");
      assertThat(express.getType()).isEqualTo("Express");
      assertThat(luxury.type()).isEqualTo("Luxury");
      assertThat(luxury.getType()).isEqualTo("Luxury");
    }

    @Test
    @DisplayName("Should track operator")
    void shouldTrackOperator() {
      Bus bus = new Bus(
          new BusId(1L), "BUS-001", "Express", "SETC Travels", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.operator()).isEqualTo("SETC Travels");
      assertThat(bus.getOperator()).isEqualTo("SETC Travels");
    }
  }

  @Nested
  @DisplayName("Timing")
  class TimingTests {

    @Test
    @DisplayName("Should track departure and arrival times")
    void shouldTrackTimes() {
      LocalTime departure = LocalTime.of(8, 0);
      LocalTime arrival = LocalTime.of(14, 0);

      Bus bus = new Bus(
          new BusId(1L), "BUS-001", "Express", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          departure, arrival, 50, List.of());

      assertThat(bus.departureTime()).isEqualTo(departure);
      assertThat(bus.getDepartureTime()).isEqualTo(departure);
      assertThat(bus.arrivalTime()).isEqualTo(arrival);
      assertThat(bus.getArrivalTime()).isEqualTo(arrival);
    }

    @Test
    @DisplayName("Should handle overnight journeys")
    void shouldHandleOvernightJourneys() {
      Bus bus = new Bus(
          new BusId(1L), "NIGHT-BUS", "Night Express", "Op", "Night",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(22, 0), LocalTime.of(6, 0), 50, List.of());

      assertThat(bus.departureTime()).isEqualTo(LocalTime.of(22, 0));
      assertThat(bus.arrivalTime()).isEqualTo(LocalTime.of(6, 0));
    }
  }

  @Nested
  @DisplayName("Capacity")
  class CapacityTests {

    @Test
    @DisplayName("Should track bus capacity")
    void shouldTrackBusCapacity() {
      Bus mini = new Bus(
          new BusId(1L), "MINI", "Mini", "Op", "Mini",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 13, List.of());

      Bus fullSize = new Bus(
          new BusId(2L), "FULL", "Full", "Op", "Full",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(mini.capacity()).isEqualTo(13);
      assertThat(mini.getCapacity()).isEqualTo(13);
      assertThat(fullSize.capacity()).isEqualTo(50);
      assertThat(fullSize.getCapacity()).isEqualTo(50);
    }
  }

  @Nested
  @DisplayName("Features")
  class FeaturesTests {

    @Test
    @DisplayName("Should track bus amenities")
    void shouldTrackBusAmenities() {
      List<String> features = Arrays.asList("AC", "WiFi", "USB Charging");

      Bus bus = new Bus(
          new BusId(1L), "LUXURY", "Luxury", "Op", "Luxury",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 40, features);

      assertThat(bus.features()).containsExactlyInAnyOrder("AC", "WiFi", "USB Charging");
      assertThat(bus.getFeatures()).containsExactlyInAnyOrder("AC", "WiFi", "USB Charging");
    }

    @Test
    @DisplayName("Should handle empty features")
    void shouldHandleEmptyFeatures() {
      Bus bus = new Bus(
          new BusId(1L), "BASIC", "Basic", "Op", "Regular",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      assertThat(bus.features()).isEmpty();
      assertThat(bus.getFeatures()).isEmpty();
    }

    @Test
    @DisplayName("Should default to empty features if null")
    void shouldDefaultToEmptyFeaturesIfNull() {
      Bus bus = new Bus(
          new BusId(1L), "BUS", "Name", "Op", "Type",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, null);

      assertThat(bus.features()).isEmpty();
    }
  }

  @Nested
  @DisplayName("Active Status")
  class ActiveStatusTests {

    @Test
    @DisplayName("Should track active status")
    void shouldTrackActiveStatus() {
      Bus activeBus = new Bus(
          new BusId(1L), "ACTIVE", "Active Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of(), true);

      Bus inactiveBus = new Bus(
          new BusId(2L), "INACTIVE", "Inactive Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of(), false);

      assertThat(activeBus.active()).isTrue();
      assertThat(inactiveBus.active()).isFalse();
    }
  }

  @Nested
  @DisplayName("With Methods (Immutable Updates)")
  class WithMethodsTests {

    @Test
    @DisplayName("Should create new bus with updated departure time")
    void shouldCreateBusWithUpdatedDepartureTime() {
      Bus original = new Bus(
          new BusId(1L), "BUS", "Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      Bus updated = original.withDepartureTime(LocalTime.of(9, 0));

      assertThat(original.departureTime()).isEqualTo(LocalTime.of(8, 0));
      assertThat(updated.departureTime()).isEqualTo(LocalTime.of(9, 0));
      assertThat(updated.id()).isEqualTo(original.id());
    }

    @Test
    @DisplayName("Should create new bus with updated arrival time")
    void shouldCreateBusWithUpdatedArrivalTime() {
      Bus original = new Bus(
          new BusId(1L), "BUS", "Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of());

      Bus updated = original.withArrivalTime(LocalTime.of(15, 0));

      assertThat(original.arrivalTime()).isEqualTo(LocalTime.of(14, 0));
      assertThat(updated.arrivalTime()).isEqualTo(LocalTime.of(15, 0));
    }

    @Test
    @DisplayName("Should create new bus with updated active status")
    void shouldCreateBusWithUpdatedActiveStatus() {
      Bus original = new Bus(
          new BusId(1L), "BUS", "Bus", "Op", "Express",
          new Location(new LocationId(1L), "A", null, 13.0, 80.0),
          new Location(new LocationId(2L), "B", null, 14.0, 81.0),
          LocalTime.of(8, 0), LocalTime.of(14, 0), 50, List.of(), true);

      Bus updated = original.withActive(false);

      assertThat(original.active()).isTrue();
      assertThat(updated.active()).isFalse();
    }
  }
}
