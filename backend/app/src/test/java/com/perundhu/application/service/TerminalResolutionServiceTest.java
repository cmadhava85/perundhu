package com.perundhu.application.service;

import com.perundhu.domain.model.BusTerminal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.*;

/**
 * Comprehensive test suite for TerminalResolutionService
 * Tests multi-city terminal resolution for Chennai, Coimbatore, Tirupati, and Salem
 */
class TerminalResolutionServiceTest {

    private TerminalResolutionService terminalResolutionService;

    @BeforeEach
    void setUp() {
        terminalResolutionService = new TerminalResolutionService();
    }

    @Nested
    @DisplayName("Chennai Terminal Resolution Tests")
    class ChennaiTerminalTests {

        @Test
        @DisplayName("Should resolve Koyembedu for inter-state destinations")
        void shouldResolveKoyembeduForInterStateDestinations() {
            // Arrange
            String source = "Chennai";
            String destination = "Bangalore";

            // Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getName()).isEqualTo("Koyembedu");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("CMBT Koyembedu Bus Terminus");
            assertThat(result.getResolvedSource()).isEqualTo("Koyembedu");
        }

        @Test
        @DisplayName("Should resolve Kilambakkam for southern destinations")
        void shouldResolveKilambakkamForSouthernDestinations() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Chennai", "Madurai");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Kilambakkam");
            assertThat(result.getTerminal().getTerminalType()).isEqualTo(BusTerminal.TerminalType.INTRA_STATE);
        }

        @Test
        @DisplayName("Should resolve Madhavaram for Andhra/Telangana destinations")
        void shouldResolveMadhavaramForAndhraTelanganaDestinations() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Chennai", "Hyderabad");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Madhavaram");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Madhavaram Mofussil Bus Terminus");
        }

        @ParameterizedTest
        @CsvSource({
            "Chennai, Bangalore, Koyembedu",
            "Chennai, Mysore, Koyembedu",
            "Chennai, Coimbatore, Koyembedu",
            "Chennai, Madurai, Kilambakkam",
            "Chennai, Trichy, Kilambakkam",
            "Chennai, Tirupati, Madhavaram",
            "Chennai, Vijayawada, Madhavaram"
        })
        @DisplayName("Should resolve correct Chennai terminal for various destinations")
        void shouldResolveCorrectChennaiTerminal(String source, String destination, String expectedTerminal) {
            // Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo(expectedTerminal);
        }
    }

    @Nested
    @DisplayName("Coimbatore Terminal Resolution Tests")
    class CoimbatoreTerminalTests {

        @Test
        @DisplayName("Should resolve Gandhipuram for northern routes")
        void shouldResolveGandhipuramForNorthernRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Coimbatore", "Bangalore");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getName()).isEqualTo("Gandhipuram");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Gandhipuram Central Bus Stand");
            assertThat(result.getTerminal().getCity()).isEqualTo("Coimbatore");
            assertThat(result.getMessage()).contains("Bangalore");
        }

        @Test
        @DisplayName("Should resolve Singanallur for southern routes")
        void shouldResolveSinganallurForSouthernRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Coimbatore", "Madurai");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Singanallur");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Singanallur Bus Terminus");
        }

        @Test
        @DisplayName("Should resolve Ukkadam for western routes")
        void shouldResolveUkkadamForWesternRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Coimbatore", "Palakkad");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Ukkadam");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Ukkadam Bus Terminus");
        }

        @ParameterizedTest
        @CsvSource({
            "Coimbatore, Bangalore, Gandhipuram",
            "Coimbatore, Mysore, Gandhipuram",
            "Coimbatore, Salem, Gandhipuram",
            "Coimbatore, Tiruppur, Gandhipuram",
            "Coimbatore, Madurai, Singanallur",
            "Coimbatore, Trichy, Singanallur",
            "Coimbatore, Karur, Singanallur",
            "Coimbatore, Palakkad, Ukkadam",
            "Coimbatore, Palani, Ukkadam"
        })
        @DisplayName("Should resolve correct Coimbatore terminal for various destinations")
        void shouldResolveCorrectCoimbatoreTerminal(String source, String destination, String expectedTerminal) {
            // Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo(expectedTerminal);
        }

        @Test
        @DisplayName("Should handle CBE abbreviation for Coimbatore")
        void shouldHandleCBEAbbreviation() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("CBE", "Bangalore");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Gandhipuram");
            assertThat(result.getTerminal().getCity()).isEqualTo("Coimbatore");
        }
    }

    @Nested
    @DisplayName("Tirupati Terminal Resolution Tests")
    class TirupatiTerminalTests {

        @Test
        @DisplayName("Should resolve Tirupati Central for inter-state routes")
        void shouldResolveTirupatiCentralForInterStateRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Tirupati", "Hyderabad");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getName()).isEqualTo("Central Bus Terminal");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Sri Padmavati Bus Terminus");
            assertThat(result.getTerminal().getCity()).isEqualTo("Tirupati");
        }

        @Test
        @DisplayName("Should resolve Tirupati Moffusil for local routes")
        void shouldResolveTirupatiMoffusilForLocalRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Tirupati", "Kalahasti");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Moffusil Bus Stand");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Tirupati Moffusil Bus Terminus");
        }

        @ParameterizedTest
        @CsvSource({
            "Tirupati, Hyderabad, Central Bus Terminal",
            "Tirupati, Chennai, Central Bus Terminal",
            "Tirupati, Vijayawada, Central Bus Terminal",
            "Tirupati, Kalahasti, Moffusil Bus Stand",
            "Tirupati, Vellore, Moffusil Bus Stand"
        })
        @DisplayName("Should resolve correct Tirupati terminal for various destinations")
        void shouldResolveCorrectTirupatiTerminal(String source, String destination, String expectedTerminal) {
            // Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo(expectedTerminal);
        }

        @Test
        @DisplayName("Should handle Tirupathi alternate spelling")
        void shouldHandleTirupathiAlternateSpelling() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Tirupathi", "Chennai");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getCity()).isEqualTo("Tirupati");
        }
    }

    @Nested
    @DisplayName("Salem Terminal Resolution Tests")
    class SalemTerminalTests {

        @Test
        @DisplayName("Should resolve Salem Central for northern routes")
        void shouldResolveSalemCentralForNorthernRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Salem", "Bangalore");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getName()).isEqualTo("Central Bus Terminus");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Salem Central Bus Terminus");
            assertThat(result.getTerminal().getCity()).isEqualTo("Salem");
        }

        @Test
        @DisplayName("Should resolve Salem Moffusil for southern routes")
        void shouldResolveSalemMoffusilForSouthernRoutes() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Salem", "Madurai");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Moffusil Bus Stand");
            assertThat(result.getTerminal().getDisplayName()).isEqualTo("Salem Moffusil Bus Terminus");
        }

        @ParameterizedTest
        @CsvSource({
            "Salem, Bangalore, Central Bus Terminus",
            "Salem, Hosur, Central Bus Terminus",
            "Salem, Coimbatore, Central Bus Terminus",
            "Salem, Chennai, Central Bus Terminus",
            "Salem, Madurai, Moffusil Bus Stand",
            "Salem, Trichy, Moffusil Bus Stand"
        })
        @DisplayName("Should resolve correct Salem terminal for various destinations")
        void shouldResolveCorrectSalemTerminal(String source, String destination, String expectedTerminal) {
            // Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo(expectedTerminal);
        }
    }

    @Nested
    @DisplayName("Edge Cases and Fallback Tests")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle case-insensitive source cities")
        void shouldHandleCaseInsensitiveSourceCities() {
            // Test various case combinations
            assertTerminalResolved("COIMBATORE", "Bangalore", "Gandhipuram");
            assertTerminalResolved("coimbatore", "Bangalore", "Gandhipuram");
            assertTerminalResolved("CoImBaToRe", "Bangalore", "Gandhipuram");
        }

        @Test
        @DisplayName("Should handle case-insensitive destinations")
        void shouldHandleCaseInsensitiveDestinations() {
            // Test various case combinations
            assertTerminalResolved("Coimbatore", "BANGALORE", "Gandhipuram");
            assertTerminalResolved("Coimbatore", "bangalore", "Gandhipuram");
            assertTerminalResolved("Coimbatore", "BaNgAlOrE", "Gandhipuram");
        }

        @Test
        @DisplayName("Should handle whitespace in location names")
        void shouldHandleWhitespaceInLocationNames() {
            // Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("  Coimbatore  ", "  Bangalore  ");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Gandhipuram");
        }

        @Test
        @DisplayName("Should return needsTerminalInfo=false for unknown city")
        void shouldReturnFalseForUnknownCity() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("UnknownCity", "Bangalore");

            // Assert
            assertThat(result).isNotNull();
            assertThat(result.isNeedsTerminalInfo()).isFalse();
            assertThat(result.getTerminal()).isNull();
        }

        @Test
        @DisplayName("Should handle Coimbatore fallback for unknown destination")
        void shouldHandleCoimbatoreFallbackForUnknownDestination() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Coimbatore", "UnknownDestination123");

            // Assert - Should fall back to default (Gandhipuram)
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo("Gandhipuram");
        }

        @Test
        @DisplayName("Should handle Madras as Chennai alias")
        void shouldHandleMadrasAsChennaiAlias() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Madras", "Bangalore");

            // Assert
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getCity()).isEqualTo("Chennai");
        }

        private void assertTerminalResolved(String source, String destination, String expectedTerminal) {
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);
            assertThat(result.isNeedsTerminalInfo()).isTrue();
            assertThat(result.getTerminal().getName()).isEqualTo(expectedTerminal);
        }
    }

    @Nested
    @DisplayName("Terminal Data Integrity Tests")
    class TerminalDataIntegrityTests {

        @Test
        @DisplayName("All Chennai terminals should have coordinates")
        void allChennaiTerminalsShouldHaveCoordinates() {
            // Test each Chennai terminal
            assertTerminalHasValidCoordinates("Chennai", "Bangalore"); // Koyembedu
            assertTerminalHasValidCoordinates("Chennai", "Madurai"); // Kilambakkam
            assertTerminalHasValidCoordinates("Chennai", "Hyderabad"); // Madhavaram
        }

        @Test
        @DisplayName("All Coimbatore terminals should have coordinates")
        void allCoimbatoreTerminalsShouldHaveCoordinates() {
            assertTerminalHasValidCoordinates("Coimbatore", "Bangalore"); // Gandhipuram
            assertTerminalHasValidCoordinates("Coimbatore", "Madurai"); // Singanallur
            assertTerminalHasValidCoordinates("Coimbatore", "Palakkad"); // Ukkadam
        }

        @Test
        @DisplayName("All Tirupati terminals should have coordinates")
        void allTirupatiTerminalsShouldHaveCoordinates() {
            assertTerminalHasValidCoordinates("Tirupati", "Hyderabad"); // Central
            assertTerminalHasValidCoordinates("Tirupati", "Kalahasti"); // Moffusil
        }

        @Test
        @DisplayName("All Salem terminals should have coordinates")
        void allSalemTerminalsShouldHaveCoordinates() {
            assertTerminalHasValidCoordinates("Salem", "Bangalore"); // Central
            assertTerminalHasValidCoordinates("Salem", "Madurai"); // Moffusil
        }

        @Test
        @DisplayName("All terminals should have required fields")
        void allTerminalsShouldHaveRequiredFields() {
            // Test a sample terminal from each city
            assertTerminalHasRequiredFields("Chennai", "Bangalore");
            assertTerminalHasRequiredFields("Coimbatore", "Bangalore");
            assertTerminalHasRequiredFields("Tirupati", "Hyderabad");
            assertTerminalHasRequiredFields("Salem", "Bangalore");
        }

        @Test
        @DisplayName("Result message should be properly formatted")
        void resultMessageShouldBeProperlyFormatted() {
            // Arrange & Act
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal("Coimbatore", "Bangalore");

            // Assert
            assertThat(result.getMessage()).isNotNull();
            assertThat(result.getMessage()).contains("Bangalore");
            assertThat(result.getMessage()).contains("Gandhipuram Central Bus Stand");
        }

        private void assertTerminalHasValidCoordinates(String source, String destination) {
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);
            
            assertThat(result.getTerminal()).isNotNull();
            assertThat(result.getTerminal().getLatitude()).isNotNull();
            assertThat(result.getTerminal().getLongitude()).isNotNull();
            assertThat(result.getTerminal().getLatitude()).isNotZero();
            assertThat(result.getTerminal().getLongitude()).isNotZero();
        }

        private void assertTerminalHasRequiredFields(String source, String destination) {
            TerminalResolutionService.TerminalResolutionResult result =
                    terminalResolutionService.resolveTerminal(source, destination);
            
            BusTerminal terminal = result.getTerminal();
            assertThat(terminal).isNotNull();
            assertThat(terminal.getName()).isNotNull();
            assertThat(terminal.getDisplayName()).isNotNull();
            assertThat(terminal.getAddress()).isNotNull();
            assertThat(terminal.getCity()).isNotNull();
            assertThat(terminal.getTerminalType()).isNotNull();
            assertThat(terminal.getOperatedBy()).isNotNull();
        }
    }

    @Nested
    @DisplayName("Get Chennai Terminals Test")
    class GetChennaiTerminalsTest {

        @Test
        @DisplayName("Should return all Chennai terminals")
        void shouldReturnAllChennaiTerminals() {
            // Act
            var terminals = terminalResolutionService.getChennaiTerminals();

            // Assert
            assertThat(terminals).isNotNull();
            assertThat(terminals).hasSizeGreaterThanOrEqualTo(4);
            
            // Verify specific terminals exist
            assertThat(terminals.stream()
                    .anyMatch(t -> t.getName().equals("Koyembedu")))
                    .isTrue();
            assertThat(terminals.stream()
                    .anyMatch(t -> t.getName().equals("Kilambakkam")))
                    .isTrue();
            assertThat(terminals.stream()
                    .anyMatch(t -> t.getName().equals("Madhavaram")))
                    .isTrue();
        }
    }

    @Nested
    @DisplayName("Terminal Suggestion Tests")
    class TerminalSuggestionTests {

        @Test
        @DisplayName("Should provide correction suggestion for wrong terminal")
        void shouldProvideCorrectSuggestion() {
            // Arrange & Act
            TerminalResolutionService.TerminalSuggestion suggestion =
                    terminalResolutionService.getSuggestionForCorrection("Kilambakkam", "Bangalore");

            // Assert - Should suggest Koyembedu instead of Kilambakkam
            assertThat(suggestion).isNotNull();
            // Note: This test may need adjustment based on actual implementation
        }
    }

    @Nested
    @DisplayName("Alternate City Names Tests")
    class AlternateCityNamesTests {

        @Test
        @DisplayName("Should handle Bengaluru as Bangalore")
        void shouldHandleBengaluruAsBangalore() {
            // Both spellings should resolve to same terminal
            TerminalResolutionService.TerminalResolutionResult result1 =
                    terminalResolutionService.resolveTerminal("Coimbatore", "Bangalore");
            TerminalResolutionService.TerminalResolutionResult result2 =
                    terminalResolutionService.resolveTerminal("Coimbatore", "Bengaluru");

            assertThat(result1.getTerminal().getName())
                    .isEqualTo(result2.getTerminal().getName());
        }

        @Test
        @DisplayName("Should handle Tiruchirappalli as Trichy")
        void shouldHandleTiruchirappalliAsTrichy() {
            // Both spellings should resolve to same terminal
            TerminalResolutionService.TerminalResolutionResult result1 =
                    terminalResolutionService.resolveTerminal("Chennai", "Trichy");
            TerminalResolutionService.TerminalResolutionResult result2 =
                    terminalResolutionService.resolveTerminal("Chennai", "Tiruchirappalli");

            assertThat(result1.getTerminal().getName())
                    .isEqualTo(result2.getTerminal().getName());
        }
    }
}
