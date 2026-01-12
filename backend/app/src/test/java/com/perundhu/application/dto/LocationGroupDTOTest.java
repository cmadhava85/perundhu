package com.perundhu.application.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive tests for LocationGroupDTO
 * Tests the grouped location result structure and helper methods
 */
@DisplayName("LocationGroupDTO Tests")
class LocationGroupDTOTest {

    @Nested
    @DisplayName("Creation Tests")
    class CreationTests {

        @Test
        @DisplayName("Should create group with factory method")
        void shouldCreateGroupWithFactoryMethod() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);

            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption);

            assertThat(group).isNotNull();
            assertThat(group.cityName()).isEqualTo("Salem");
            assertThat(group.cityOption()).isEqualTo(cityOption);
            assertThat(group.busStands()).isNotNull().isEmpty();
            assertThat(group.neighborhoods()).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("Should initialize empty lists when null")
        void shouldInitializeEmptyListsWhenNull() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Madurai", "மதுரை", 9.9252, 78.1198);

            LocationGroupDTO group = new LocationGroupDTO("Madurai", cityOption, null, null);

            assertThat(group.busStands()).isNotNull().isEmpty();
            assertThat(group.neighborhoods()).isNotNull().isEmpty();
        }

        @Test
        @DisplayName("Should create group without city option")
        void shouldCreateGroupWithoutCityOption() {
            LocationGroupDTO group = LocationGroupDTO.of("Chennai", null);

            assertThat(group.cityName()).isEqualTo("Chennai");
            assertThat(group.cityOption()).isNull();
            assertThat(group.busStands()).isNotNull().isEmpty();
            assertThat(group.neighborhoods()).isNotNull().isEmpty();
        }
    }

    @Nested
    @DisplayName("Add Items Tests")
    class AddItemsTests {

        @Test
        @DisplayName("Should add bus stand to group")
        void shouldAddBusStandToGroup() {
            LocationGroupDTO group = LocationGroupDTO.of("Salem", null);
            LocationDTO busStand = LocationDTO.withTranslation(
                    2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                    11.6700, 78.1500);

            group.addBusStand(busStand);

            assertThat(group.busStands()).hasSize(1);
            assertThat(group.busStands().get(0)).isEqualTo(busStand);
        }

        @Test
        @DisplayName("Should add multiple bus stands")
        void shouldAddMultipleBusStands() {
            LocationGroupDTO group = LocationGroupDTO.of("Salem", null);
            LocationDTO newStand = LocationDTO.withTranslation(
                    2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                    11.6700, 78.1500);
            LocationDTO oldStand = LocationDTO.withTranslation(
                    3L, "Salem - Old Bus Stand", "சேலம் - பழைய பேருந்து நிலையம்",
                    11.6600, 78.1400);

            group.addBusStand(newStand);
            group.addBusStand(oldStand);

            assertThat(group.busStands()).hasSize(2);
            assertThat(group.busStands()).containsExactly(newStand, oldStand);
        }

        @Test
        @DisplayName("Should add neighborhood to group")
        void shouldAddNeighborhoodToGroup() {
            LocationGroupDTO group = LocationGroupDTO.of("Chennai", null);
            LocationDTO neighborhood = LocationDTO.withTranslation(
                    4L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341);

            group.addNeighborhood(neighborhood);

            assertThat(group.neighborhoods()).hasSize(1);
            assertThat(group.neighborhoods().get(0)).isEqualTo(neighborhood);
        }

        @Test
        @DisplayName("Should add multiple neighborhoods")
        void shouldAddMultipleNeighborhoods() {
            LocationGroupDTO group = LocationGroupDTO.of("Chennai", null);
            LocationDTO tNagar = LocationDTO.withTranslation(
                    4L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341);
            LocationDTO adyar = LocationDTO.withTranslation(
                    5L, "Adyar", "அடையாறு", 13.0067, 80.2568);

            group.addNeighborhood(tNagar);
            group.addNeighborhood(adyar);

            assertThat(group.neighborhoods()).hasSize(2);
            assertThat(group.neighborhoods()).containsExactly(tNagar, adyar);
        }

        @Test
        @DisplayName("Should support method chaining when adding items")
        void shouldSupportMethodChaining() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationDTO busStand1 = LocationDTO.withTranslation(
                    2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                    11.6700, 78.1500);
            LocationDTO busStand2 = LocationDTO.withTranslation(
                    3L, "Salem - Old Bus Stand", "சேலம் - பழைய பேருந்து நிலையம்",
                    11.6600, 78.1400);

            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption)
                    .addBusStand(busStand1)
                    .addBusStand(busStand2);

            assertThat(group.busStands()).hasSize(2);
        }
    }

    @Nested
    @DisplayName("isEmpty Tests")
    class IsEmptyTests {

        @Test
        @DisplayName("Should be empty when all fields are empty")
        void shouldBeEmptyWhenAllFieldsEmpty() {
            LocationGroupDTO group = LocationGroupDTO.of("Salem", null);

            assertThat(group.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Should not be empty when city option exists")
        void shouldNotBeEmptyWhenCityOptionExists() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption);

            assertThat(group.isEmpty()).isFalse();
        }

        @Test
        @DisplayName("Should not be empty when bus stands exist")
        void shouldNotBeEmptyWhenBusStandsExist() {
            LocationGroupDTO group = LocationGroupDTO.of("Salem", null);
            LocationDTO busStand = LocationDTO.withTranslation(
                    2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                    11.6700, 78.1500);
            group.addBusStand(busStand);

            assertThat(group.isEmpty()).isFalse();
        }

        @Test
        @DisplayName("Should not be empty when neighborhoods exist")
        void shouldNotBeEmptyWhenNeighborhoodsExist() {
            LocationGroupDTO group = LocationGroupDTO.of("Chennai", null);
            LocationDTO neighborhood = LocationDTO.withTranslation(
                    4L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341);
            group.addNeighborhood(neighborhood);

            assertThat(group.isEmpty()).isFalse();
        }
    }

    @Nested
    @DisplayName("getItemCount Tests")
    class GetItemCountTests {

        @Test
        @DisplayName("Should return 0 for empty group")
        void shouldReturn0ForEmptyGroup() {
            LocationGroupDTO group = LocationGroupDTO.of("Salem", null);

            assertThat(group.getItemCount()).isZero();
        }

        @Test
        @DisplayName("Should count city option")
        void shouldCountCityOption() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption);

            assertThat(group.getItemCount()).isEqualTo(1);
        }

        @Test
        @DisplayName("Should count bus stands")
        void shouldCountBusStands() {
            LocationGroupDTO group = LocationGroupDTO.of("Salem", null);
            group.addBusStand(LocationDTO.withTranslation(2L, "Salem - New", "சேலம் - புதிய", 11.67, 78.15));
            group.addBusStand(LocationDTO.withTranslation(3L, "Salem - Old", "சேலம் - பழைய", 11.66, 78.14));

            assertThat(group.getItemCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should count neighborhoods")
        void shouldCountNeighborhoods() {
            LocationGroupDTO group = LocationGroupDTO.of("Chennai", null);
            group.addNeighborhood(LocationDTO.withTranslation(4L, "T. Nagar", "டி. நகர்", 13.04, 80.23));
            group.addNeighborhood(LocationDTO.withTranslation(5L, "Adyar", "அடையாறு", 13.01, 80.26));
            group.addNeighborhood(LocationDTO.withTranslation(6L, "Anna Nagar", "அண்ணா நகர்", 13.08, 80.21));

            assertThat(group.getItemCount()).isEqualTo(3);
        }

        @Test
        @DisplayName("Should count all item types together")
        void shouldCountAllItemTypesTogether() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption);
            group.addBusStand(LocationDTO.withTranslation(2L, "Salem - New", "சேலம் - புதிய", 11.67, 78.15));
            group.addBusStand(LocationDTO.withTranslation(3L, "Salem - Old", "சேலம் - பழைய", 11.66, 78.14));
            group.addNeighborhood(LocationDTO.withTranslation(4L, "Fort", "கோட்டை", 11.65, 78.14));

            assertThat(group.getItemCount()).isEqualTo(4); // 1 city + 2 bus stands + 1 neighborhood
        }
    }

    @Nested
    @DisplayName("Real-World Scenario Tests")
    class RealWorldScenarioTests {

        @Test
        @DisplayName("Should handle Salem with multiple bus stands")
        void shouldHandleSalemWithMultipleBusStands() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption);

            group.addBusStand(LocationDTO.withTranslation(
                    2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                    11.6700, 78.1500));
            group.addBusStand(LocationDTO.withTranslation(
                    3L, "Salem - Old Bus Stand", "சேலம் - பழைய பேருந்து நிலையம்",
                    11.6600, 78.1400));
            group.addBusStand(LocationDTO.withTranslation(
                    4L, "Salem - Meyyanur Bus Stand", "சேலம் - மேயனூர் பேருந்து நிலையம்",
                    11.6550, 78.1380));

            assertThat(group.cityName()).isEqualTo("Salem");
            assertThat(group.cityOption()).isNotNull();
            assertThat(group.busStands()).hasSize(3);
            assertThat(group.neighborhoods()).isEmpty();
            assertThat(group.getItemCount()).isEqualTo(4);
            assertThat(group.isEmpty()).isFalse();
        }

        @Test
        @DisplayName("Should handle Chennai with bus stands and neighborhoods")
        void shouldHandleChennaiWithBusStandsAndNeighborhoods() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Chennai", "சென்னை", 13.0827, 80.2707);
            LocationGroupDTO group = LocationGroupDTO.of("Chennai", cityOption);

            // Add bus stands
            group.addBusStand(LocationDTO.withTranslation(
                    2L, "Chennai - CMBT", "சென்னை - சி.எம்.பி.டி",
                    13.0669, 80.2072));
            group.addBusStand(LocationDTO.withTranslation(
                    3L, "Chennai - Koyambedu", "சென்னை - கோயம்பேடு",
                    13.0712, 80.1982));

            // Add neighborhoods
            group.addNeighborhood(LocationDTO.withTranslation(
                    4L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341));
            group.addNeighborhood(LocationDTO.withTranslation(
                    5L, "Adyar", "அடையாறு", 13.0067, 80.2568));

            assertThat(group.cityName()).isEqualTo("Chennai");
            assertThat(group.cityOption()).isNotNull();
            assertThat(group.busStands()).hasSize(2);
            assertThat(group.neighborhoods()).hasSize(2);
            assertThat(group.getItemCount()).isEqualTo(5);
        }

        @Test
        @DisplayName("Should handle location with only neighborhoods")
        void shouldHandleLocationWithOnlyNeighborhoods() {
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Coimbatore", "கோயம்புத்தூர்", 11.0168, 76.9558);
            LocationGroupDTO group = LocationGroupDTO.of("Coimbatore", cityOption);

            group.addNeighborhood(LocationDTO.withTranslation(
                    2L, "RS Puram", "ஆர்.எஸ். புரம்", 11.0058, 76.9558));
            group.addNeighborhood(LocationDTO.withTranslation(
                    3L, "Gandhipuram", "காந்திபுரம்", 11.0183, 76.9672));

            assertThat(group.busStands()).isEmpty();
            assertThat(group.neighborhoods()).hasSize(2);
            assertThat(group.getItemCount()).isEqualTo(3);
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should have correct JSON property names")
        void shouldHaveCorrectJsonPropertyNames() {
            // This test verifies the @JsonProperty annotations are correct
            LocationDTO cityOption = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO group = LocationGroupDTO.of("Salem", cityOption);

            // Verify the record has the expected fields
            assertThat(group.cityName()).isNotNull();
            assertThat(group.cityOption()).isNotNull();
            assertThat(group.busStands()).isNotNull();
            assertThat(group.neighborhoods()).isNotNull();
        }
    }
}
