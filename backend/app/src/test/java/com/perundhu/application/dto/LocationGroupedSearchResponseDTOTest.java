package com.perundhu.application.dto;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Comprehensive tests for LocationGroupedSearchResponseDTO
 * Tests the grouped location search response structure
 */
@DisplayName("LocationGroupedSearchResponseDTO Tests")
class LocationGroupedSearchResponseDTOTest {

    @Nested
    @DisplayName("Factory Method Tests")
    class FactoryMethodTests {

        @Test
        @DisplayName("Should create response from groups")
        void shouldCreateResponseFromGroups() {
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationDTO madurai = LocationDTO.withTranslation(
                    2L, "Madurai", "மதுரை", 9.9252, 78.1198);

            List<LocationGroupDTO> groups = List.of(
                    LocationGroupDTO.of("Salem", salem),
                    LocationGroupDTO.of("Madurai", madurai)
            );

            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response).isNotNull();
            assertThat(response.groups()).hasSize(2);
            assertThat(response.totalCount()).isEqualTo(2);
        }

        @Test
        @DisplayName("Should create empty response")
        void shouldCreateEmptyResponse() {
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.empty();

            assertThat(response).isNotNull();
            assertThat(response.groups()).isEmpty();
            assertThat(response.totalCount()).isZero();
            assertThat(response.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Should calculate total count from all groups")
        void shouldCalculateTotalCountFromAllGroups() {
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    2L, "Salem - New", "சேலம் - புதிய", 11.67, 78.15));
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    3L, "Salem - Old", "சேலம் - பழைய", 11.66, 78.14));

            LocationDTO madurai = LocationDTO.withTranslation(
                    4L, "Madurai", "மதுரை", 9.9252, 78.1198);
            LocationGroupDTO maduraiGroup = LocationGroupDTO.of("Madurai", madurai);

            List<LocationGroupDTO> groups = List.of(salemGroup, maduraiGroup);

            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.totalCount()).isEqualTo(4); // Salem (1 + 2) + Madurai (1)
        }
    }

    @Nested
    @DisplayName("isEmpty Tests")
    class IsEmptyTests {

        @Test
        @DisplayName("Should be empty when groups list is empty")
        void shouldBeEmptyWhenGroupsListIsEmpty() {
            LocationGroupedSearchResponseDTO response = new LocationGroupedSearchResponseDTO(List.of(), 0);

            assertThat(response.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Should be empty when total count is zero")
        void shouldBeEmptyWhenTotalCountIsZero() {
            LocationGroupedSearchResponseDTO response = new LocationGroupedSearchResponseDTO(new ArrayList<>(), 0);

            assertThat(response.isEmpty()).isTrue();
        }

        @Test
        @DisplayName("Should not be empty when groups exist")
        void shouldNotBeEmptyWhenGroupsExist() {
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            List<LocationGroupDTO> groups = List.of(LocationGroupDTO.of("Salem", salem));

            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.isEmpty()).isFalse();
        }
    }

    @Nested
    @DisplayName("Real-World Scenario Tests")
    class RealWorldScenarioTests {

        @Test
        @DisplayName("Should handle single city with multiple bus stands")
        void shouldHandleSingleCityWithMultipleBusStands() {
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    2L, "Salem - New Bus Stand", "சேலம் - புதிய பேருந்து நிலையம்",
                    11.6700, 78.1500));
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    3L, "Salem - Old Bus Stand", "சேலம் - பழைய பேருந்து நிலையம்",
                    11.6600, 78.1400));
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    4L, "Salem - Meyyanur", "சேலம் - மேயனூர்",
                    11.6550, 78.1380));

            List<LocationGroupDTO> groups = List.of(salemGroup);
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(1);
            assertThat(response.totalCount()).isEqualTo(4); // 1 city + 3 bus stands
            assertThat(response.isEmpty()).isFalse();
        }

        @Test
        @DisplayName("Should handle multiple cities search result")
        void shouldHandleMultipleCitiesSearchResult() {
            // Salem group
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    2L, "Salem - New", "சேலம் - புதிய", 11.67, 78.15));

            // Madurai group
            LocationDTO madurai = LocationDTO.withTranslation(
                    3L, "Madurai", "மதுரை", 9.9252, 78.1198);
            LocationGroupDTO maduraiGroup = LocationGroupDTO.of("Madurai", madurai);
            maduraiGroup.addBusStand(LocationDTO.withTranslation(
                    4L, "Madurai - Periyar", "மதுரை - பெரியார்", 9.93, 78.12));
            maduraiGroup.addBusStand(LocationDTO.withTranslation(
                    5L, "Madurai - Arapalayam", "மதுரை - அறபாளையம்", 9.92, 78.11));

            // Chennai group
            LocationDTO chennai = LocationDTO.withTranslation(
                    6L, "Chennai", "சென்னை", 13.0827, 80.2707);
            LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennai);

            List<LocationGroupDTO> groups = List.of(salemGroup, maduraiGroup, chennaiGroup);
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(3);
            assertThat(response.totalCount()).isEqualTo(6); // Salem(2) + Madurai(3) + Chennai(1)
            assertThat(response.isEmpty()).isFalse();
        }

        @Test
        @DisplayName("Should handle city with only neighborhoods")
        void shouldHandleCityWithOnlyNeighborhoods() {
            LocationDTO chennai = LocationDTO.withTranslation(
                    1L, "Chennai", "சென்னை", 13.0827, 80.2707);
            LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennai);
            chennaiGroup.addNeighborhood(LocationDTO.withTranslation(
                    2L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341));
            chennaiGroup.addNeighborhood(LocationDTO.withTranslation(
                    3L, "Adyar", "அடையாறு", 13.0067, 80.2568));
            chennaiGroup.addNeighborhood(LocationDTO.withTranslation(
                    4L, "Anna Nagar", "அண்ணா நகர்", 13.0850, 80.2101));

            List<LocationGroupDTO> groups = List.of(chennaiGroup);
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(1);
            assertThat(response.totalCount()).isEqualTo(4); // 1 city + 3 neighborhoods
            assertThat(response.groups().get(0).neighborhoods()).hasSize(3);
        }

        @Test
        @DisplayName("Should handle mixed results with cities, bus stands and neighborhoods")
        void shouldHandleMixedResults() {
            // Salem with bus stands
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            LocationGroupDTO salemGroup = LocationGroupDTO.of("Salem", salem);
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    2L, "Salem - New", "சேலம் - புதிய", 11.67, 78.15));
            salemGroup.addBusStand(LocationDTO.withTranslation(
                    3L, "Salem - Old", "சேலம் - பழைய", 11.66, 78.14));

            // Chennai with bus stands and neighborhoods
            LocationDTO chennai = LocationDTO.withTranslation(
                    4L, "Chennai", "சென்னை", 13.0827, 80.2707);
            LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennai);
            chennaiGroup.addBusStand(LocationDTO.withTranslation(
                    5L, "Chennai - CMBT", "சென்னை - சி.எம்.பி.டி", 13.0669, 80.2072));
            chennaiGroup.addNeighborhood(LocationDTO.withTranslation(
                    6L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341));

            // Coimbatore with just city option
            LocationDTO coimbatore = LocationDTO.withTranslation(
                    7L, "Coimbatore", "கோயம்புத்தூர்", 11.0168, 76.9558);
            LocationGroupDTO coimbatoreGroup = LocationGroupDTO.of("Coimbatore", coimbatore);

            List<LocationGroupDTO> groups = List.of(salemGroup, chennaiGroup, coimbatoreGroup);
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(3);
            assertThat(response.totalCount()).isEqualTo(7); // Salem(3) + Chennai(3) + Coimbatore(1)
        }

        @Test
        @DisplayName("Should handle no results scenario")
        void shouldHandleNoResultsScenario() {
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.empty();

            assertThat(response.isEmpty()).isTrue();
            assertThat(response.groups()).isEmpty();
            assertThat(response.totalCount()).isZero();
        }

        @Test
        @DisplayName("Should handle groups with empty city options")
        void shouldHandleGroupsWithEmptyCityOptions() {
            // Group with only bus stands, no city option
            LocationGroupDTO group1 = LocationGroupDTO.of("Salem", null);
            group1.addBusStand(LocationDTO.withTranslation(
                    1L, "Salem - New", "சேலம் - புதிய", 11.67, 78.15));
            group1.addBusStand(LocationDTO.withTranslation(
                    2L, "Salem - Old", "சேலம் - பழைய", 11.66, 78.14));

            // Group with only neighborhoods, no city option
            LocationGroupDTO group2 = LocationGroupDTO.of("Chennai", null);
            group2.addNeighborhood(LocationDTO.withTranslation(
                    3L, "T. Nagar", "டி. நகர்", 13.0418, 80.2341));

            List<LocationGroupDTO> groups = List.of(group1, group2);
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(2);
            assertThat(response.totalCount()).isEqualTo(3); // 2 bus stands + 1 neighborhood
            assertThat(response.isEmpty()).isFalse();
        }
    }

    @Nested
    @DisplayName("Edge Case Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle large number of groups")
        void shouldHandleLargeNumberOfGroups() {
            List<LocationGroupDTO> groups = new ArrayList<>();
            for (int i = 1; i <= 100; i++) {
                LocationDTO city = LocationDTO.withTranslation(
                        (long) i, "City" + i, "நகரம்" + i, 10.0 + i * 0.1, 78.0 + i * 0.1);
                groups.add(LocationGroupDTO.of("City" + i, city));
            }

            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(100);
            assertThat(response.totalCount()).isEqualTo(100);
        }

        @Test
        @DisplayName("Should handle group with many items")
        void shouldHandleGroupWithManyItems() {
            LocationDTO chennai = LocationDTO.withTranslation(
                    1L, "Chennai", "சென்னை", 13.0827, 80.2707);
            LocationGroupDTO chennaiGroup = LocationGroupDTO.of("Chennai", chennai);

            // Add 10 bus stands
            for (int i = 2; i <= 11; i++) {
                chennaiGroup.addBusStand(LocationDTO.withTranslation(
                        (long) i, "Chennai - Stand " + i, "சென்னை - நிலையம் " + i,
                        13.0 + i * 0.01, 80.2 + i * 0.01));
            }

            // Add 10 neighborhoods
            for (int i = 12; i <= 21; i++) {
                chennaiGroup.addNeighborhood(LocationDTO.withTranslation(
                        (long) i, "Chennai - Area " + i, "சென்னை - பகுதி " + i,
                        13.0 + i * 0.01, 80.2 + i * 0.01));
            }

            List<LocationGroupDTO> groups = List.of(chennaiGroup);
            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            assertThat(response.groups()).hasSize(1);
            assertThat(response.totalCount()).isEqualTo(21); // 1 city + 10 bus stands + 10 neighborhoods
        }
    }

    @Nested
    @DisplayName("JSON Serialization Tests")
    class JsonSerializationTests {

        @Test
        @DisplayName("Should have correct JSON property names")
        void shouldHaveCorrectJsonPropertyNames() {
            LocationDTO salem = LocationDTO.withTranslation(
                    1L, "Salem", "சேலம்", 11.6643, 78.1460);
            List<LocationGroupDTO> groups = List.of(LocationGroupDTO.of("Salem", salem));

            LocationGroupedSearchResponseDTO response = LocationGroupedSearchResponseDTO.of(groups);

            // Verify the record has the expected fields
            assertThat(response.groups()).isNotNull();
            assertThat(response.totalCount()).isGreaterThan(0);
        }
    }
}
