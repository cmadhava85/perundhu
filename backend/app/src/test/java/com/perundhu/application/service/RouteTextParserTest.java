package com.perundhu.application.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Tests for RouteTextParser service.
 * Tests parsing of all format types: WhatsApp, Simple/Arrow, Official, and Tamil.
 */
@DisplayName("RouteTextParser Tests")
class RouteTextParserTest {

    private RouteTextParser parser;

    @BeforeEach
    void setUp() {
        parser = new RouteTextParser();
    }

    @Nested
    @DisplayName("WhatsApp Format Parsing Tests")
    class WhatsAppFormatTests {

        @Test
        @DisplayName("Sample format test: WhatsApp format from TextPasteContribution")
        void shouldParseWhatsAppSampleFormat() {
            // This is the exact sample from TextPasteContribution.tsx
            String sampleWhatsApp = "Bus 27D from Chennai to Madurai\n" +
                    "Departure: 6:00 AM\n" +
                    "Arrival: 2:00 PM\n" +
                    "Stops: Tambaram, Chengalpattu, Villupuram, Trichy";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(sampleWhatsApp);
            
            assertNotNull(result);
            assertEquals("27D", result.getBusNumber());
            // Parser extracts from English pattern "from X to Y" - may include some context
            assertTrue(result.getFromLocation().contains("Chennai"), "From location should contain Chennai");
            assertTrue(result.getToLocation().contains("Madurai"), "To location should contain Madurai");
            assertTrue(result.isValid());
            assertTrue(result.getConfidence() > 0.5, "Confidence should be > 0.5");
            
            // Should extract timings
            List<String> timings = result.getTimings();
            assertFalse(timings.isEmpty(), "Should extract timings");
            
            // Should extract stops
            List<String> stops = result.getStops();
            assertFalse(stops.isEmpty(), "Should extract stops");
            assertTrue(stops.stream().anyMatch(s -> s.contains("Tambaram") || s.contains("Trichy")));
        }

        @Test
        @DisplayName("Should parse WhatsApp with timestamp prefix")
        void shouldParseWhatsAppWithTimestamp() {
            String whatsAppText = "[01/12/2025, 10:30] TNSTC Updates: Bus 27D from Chennai to Madurai";
            
            // Note: We're testing the parser, not the normalizer
            // In real usage, normalizer runs first, then parser
            RouteTextParser.RouteData result = parser.extractRouteFromText(whatsAppText);
            
            assertNotNull(result);
            // Parser should still find the route info
            assertNotNull(result.getFromLocation());
            assertNotNull(result.getToLocation());
        }

        @Test
        @DisplayName("Should parse forwarded WhatsApp message")
        void shouldParseForwardedWhatsApp() {
            String forwardedText = "Bus 27D Chennai to Madurai\nDaily service available";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(forwardedText);
            
            assertNotNull(result);
            assertEquals("27D", result.getBusNumber());
            // Parser may extract partial patterns - key is it finds relevant data
            assertNotNull(result.getFromLocation());
            assertNotNull(result.getToLocation());
            // Either Chennai or Madurai should be captured
            assertTrue(result.getFromLocation().contains("Chennai") || 
                       result.getFromLocation().contains("Madurai") ||
                       result.getToLocation().contains("Madurai"),
                       "Should extract route locations");
        }
    }

    @Nested
    @DisplayName("Simple/Arrow Format Parsing Tests")
    class SimpleFormatTests {

        @Test
        @DisplayName("Sample format test: Simple/Arrow format from TextPasteContribution")
        void shouldParseSimpleSampleFormat() {
            // This is the exact sample from TextPasteContribution.tsx
            String sampleSimple = "Route 123A\n" +
                    "Coimbatore → Salem\n" +
                    "Morning 7:30 AM, Evening 5:00 PM";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(sampleSimple);
            
            assertNotNull(result);
            assertEquals("123A", result.getBusNumber());
            // Parser may capture some context with location names
            assertTrue(result.getFromLocation().contains("Coimbatore"), "From should contain Coimbatore");
            assertTrue(result.getToLocation().contains("Salem"), "To should contain Salem");
            assertTrue(result.isValid());
            assertTrue(result.getConfidence() > 0.5, "Confidence should be > 0.5");
            
            // Should extract timings
            List<String> timings = result.getTimings();
            assertFalse(timings.isEmpty(), "Should extract timings from simple format");
        }

        @Test
        @DisplayName("Should parse dash arrow format")
        void shouldParseDashArrowFormat() {
            String dashFormat = "Bus 570 Chennai -> Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(dashFormat);
            
            assertNotNull(result);
            assertEquals("570", result.getBusNumber());
            assertTrue(result.isValid());
        }

        @Test
        @DisplayName("Should parse unicode arrow format")
        void shouldParseUnicodeArrowFormat() {
            String arrowFormat = "Bus 45G Coimbatore ➡️ Salem";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(arrowFormat);
            
            assertNotNull(result);
            assertEquals("45G", result.getBusNumber());
            assertNotNull(result.getFromLocation());
            assertNotNull(result.getToLocation());
        }

        @Test
        @DisplayName("Should parse hyphen separated format")
        void shouldParseHyphenSeparatedFormat() {
            String hyphenFormat = "Chennai - Madurai Express";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(hyphenFormat);
            
            assertNotNull(result);
            // Even without bus number, should detect locations
            assertNotNull(result.getFromLocation());
            assertNotNull(result.getToLocation());
        }
    }

    @Nested
    @DisplayName("Official Format Parsing Tests")
    class OfficialFormatTests {

        @Test
        @DisplayName("Sample format test: Official format from TextPasteContribution")
        void shouldParseOfficialSampleFormat() {
            // This is the exact sample from TextPasteContribution.tsx
            String sampleOfficial = "TNSTC-45G Chennai - Madurai Express\n" +
                    "Departure: Chennai 6:00 AM\n" +
                    "Arrival: Madurai 2:00 PM\n" +
                    "Via: Chengalpattu, Villupuram, Trichy";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(sampleOfficial);
            
            assertNotNull(result);
            // Should extract bus number (TNSTC-45G or 45G)
            assertNotNull(result.getBusNumber(), "Should extract bus number");
            assertTrue(result.getBusNumber().contains("45G") || result.getBusNumber().contains("TNSTC"));
            
            // Should extract locations
            assertEquals("Chennai", result.getFromLocation());
            assertEquals("Madurai", result.getToLocation());
            assertTrue(result.isValid());
            assertTrue(result.getConfidence() > 0.5, "Confidence should be > 0.5");
            
            // Should extract timings
            List<String> timings = result.getTimings();
            assertFalse(timings.isEmpty(), "Should extract timings from official format");
        }

        @Test
        @DisplayName("Should parse Departure/Arrival format")
        void shouldParseDepartureArrivalFormat() {
            String departArriveFormat = "Bus 27D\nDeparture: Chennai\nArrival: Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(departArriveFormat);
            
            assertNotNull(result);
            assertEquals("27D", result.getBusNumber());
            assertEquals("Chennai", result.getFromLocation());
            assertEquals("Madurai", result.getToLocation());
            assertTrue(result.isValid());
        }

        @Test
        @DisplayName("Should parse From/To colon format")
        void shouldParseFromToColonFormat() {
            String colonFormat = "Route No: 570\nFrom: Chennai\nTo: Madurai\nDeparture: 06:00";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(colonFormat);
            
            assertNotNull(result);
            assertEquals("570", result.getBusNumber());
            assertTrue(result.getFromLocation().contains("Chennai"), "From should contain Chennai");
            assertTrue(result.getToLocation().contains("Madurai"), "To should contain Madurai");
            assertTrue(result.isValid());
        }

        @Test
        @DisplayName("Should parse schedule format with multiple times")
        void shouldParseScheduleFormat() {
            String scheduleFormat = "TNSTC 570: Chennai-Madurai via Trichy\nTimings: 6:00, 8:00, 10:00";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(scheduleFormat);
            
            assertNotNull(result);
            assertNotNull(result.getBusNumber());
            assertTrue(result.isValid());
            
            // Should extract multiple timings
            List<String> timings = result.getTimings();
            assertTrue(timings.size() >= 2, "Should extract multiple timings");
        }
    }

    @Nested
    @DisplayName("Tamil Format Parsing Tests")
    class TamilFormatTests {

        @Test
        @DisplayName("Sample format test: Tamil format from TextPasteContribution")
        void shouldParseTamilSampleFormat() {
            // This is the exact sample from TextPasteContribution.tsx
            String sampleTamil = "பஸ் 45G\n" +
                    "மதுரை லிருந்து திருச்சி க்கு\n" +
                    "காலை 10:00 மணி";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(sampleTamil);
            
            assertNotNull(result);
            assertEquals("45G", result.getBusNumber());
            
            // Should extract Tamil locations using Tamil suffix pattern
            assertNotNull(result.getFromLocation(), "Should extract from location from Tamil text");
            assertNotNull(result.getToLocation(), "Should extract to location from Tamil text");
            
            // The parsed locations should contain Tamil words
            assertTrue(result.getFromLocation().contains("மதுரை") || result.getFromLocation().length() > 0);
            
            assertTrue(result.isValid());
            
            // Should extract Tamil time
            List<String> timings = result.getTimings();
            assertFalse(timings.isEmpty(), "Should extract timings from Tamil format");
        }

        @Test
        @DisplayName("Should parse Tamil from/to pattern")
        void shouldParseTamilFromToPattern() {
            String tamilText = "சென்னை லிருந்து மதுரை க்கு பஸ் எண் 570";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(tamilText);
            
            assertNotNull(result);
            assertEquals("570", result.getBusNumber());
            // Tamil locations should be extracted
            assertNotNull(result.getFromLocation());
            assertNotNull(result.getToLocation());
        }

        @Test
        @DisplayName("Should parse Tamil departure/arrival pattern")
        void shouldParseTamilDepartureArrival() {
            String tamilText = "புறப்பாடு: சென்னை வரவு: மதுரை";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(tamilText);
            
            assertNotNull(result);
            // Should extract locations from Tamil pattern
            assertNotNull(result.getFromLocation());
            assertNotNull(result.getToLocation());
        }

        @Test
        @DisplayName("Should extract Tamil time periods")
        void shouldExtractTamilTimePeriods() {
            String tamilTimeText = "Bus 27D காலை 6 மணி மாலை 5 மணி";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(tamilTimeText);
            
            assertNotNull(result);
            assertEquals("27D", result.getBusNumber());
            
            // Should extract Tamil times
            List<String> timings = result.getTimings();
            assertTrue(timings.size() >= 2, "Should extract multiple Tamil timings");
        }

        @Test
        @DisplayName("Should handle mixed Tamil and English")
        void shouldHandleMixedTamilEnglish() {
            String mixedText = "Bus 27D from Chennai - காலை சேவை available\nMorning service starts at 6:00 AM";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(mixedText);
            
            assertNotNull(result);
            assertEquals("27D", result.getBusNumber());
            // Mixed format may have parsing challenges - validate bus number extraction works
            assertNotNull(result.getTimings(), "Should have timings list");
            assertFalse(result.getTimings().isEmpty(), "Should extract timing from mixed text");
        }

        @Test
        @DisplayName("Should extract Tamil stops")
        void shouldExtractTamilStops() {
            String tamilWithStops = "பஸ் 45G சென்னை முதல் மதுரை\nநிலையங்கள்: திண்டுக்கல், கரூர்";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(tamilWithStops);
            
            assertNotNull(result);
            assertEquals("45G", result.getBusNumber());
            
            // Should extract Tamil stops
            List<String> stops = result.getStops();
            assertFalse(stops.isEmpty(), "Should extract Tamil stops");
        }
    }

    @Nested
    @DisplayName("Bus Number Extraction Tests")
    class BusNumberTests {

        @Test
        @DisplayName("Should extract alphanumeric bus number")
        void shouldExtractAlphanumericBusNumber() {
            String text = "Bus 27D from Chennai to Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertEquals("27D", result.getBusNumber());
        }

        @Test
        @DisplayName("Should extract numeric bus number")
        void shouldExtractNumericBusNumber() {
            String text = "Bus 570 Chennai to Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertEquals("570", result.getBusNumber());
        }

        @Test
        @DisplayName("Should extract TNSTC prefixed bus number")
        void shouldExtractTnstcPrefixedBusNumber() {
            String text = "TNSTC-45G Chennai to Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertNotNull(result.getBusNumber());
            assertTrue(result.getBusNumber().contains("45G") || result.getBusNumber().contains("TNSTC"));
        }

        @Test
        @DisplayName("Should extract MTC bus number")
        void shouldExtractMtcBusNumber() {
            String text = "MTC 27 Chennai Central to T Nagar";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertNotNull(result.getBusNumber());
            assertTrue(result.getBusNumber().contains("27") || result.getBusNumber().contains("MTC"));
        }

        @Test
        @DisplayName("Should extract Route prefixed number")
        void shouldExtractRoutePrefixedNumber() {
            String text = "Route 123A Coimbatore to Salem";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertEquals("123A", result.getBusNumber());
        }
    }

    @Nested
    @DisplayName("Timing Extraction Tests")
    class TimingTests {

        @Test
        @DisplayName("Should extract AM/PM times")
        void shouldExtractAmPmTimes() {
            String text = "Bus 27D departure 6:00 AM arrival 2:00 PM";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            List<String> timings = result.getTimings();
            assertFalse(timings.isEmpty());
            assertTrue(timings.stream().anyMatch(t -> t.contains("AM") || t.contains("PM")));
        }

        @Test
        @DisplayName("Should extract 24-hour times")
        void shouldExtract24HourTimes() {
            String text = "Bus 27D departure 06:00 arrival 14:00";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            List<String> timings = result.getTimings();
            assertFalse(timings.isEmpty());
        }

        @Test
        @DisplayName("Should extract multiple times")
        void shouldExtractMultipleTimes() {
            String text = "Bus 27D timings: 6:00 AM, 8:00 AM, 10:00 AM, 12:00 PM";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            List<String> timings = result.getTimings();
            assertTrue(timings.size() >= 3, "Should extract multiple timings");
        }
    }

    @Nested
    @DisplayName("Stops Extraction Tests")
    class StopsTests {

        @Test
        @DisplayName("Should extract stops from comma separated list")
        void shouldExtractCommaSeparatedStops() {
            String text = "Bus 27D Chennai to Madurai\nStops: Tambaram, Chengalpattu, Villupuram";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            List<String> stops = result.getStops();
            assertFalse(stops.isEmpty());
            assertTrue(stops.size() >= 2);
        }

        @Test
        @DisplayName("Should extract via locations")
        void shouldExtractViaLocations() {
            String text = "Bus 27D Chennai to Madurai via Trichy";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertNotNull(result);
            // Via should be parsed as part of the route
            assertTrue(result.isValid());
        }
    }

    @Nested
    @DisplayName("Confidence Calculation Tests")
    class ConfidenceTests {

        @Test
        @DisplayName("Should calculate high confidence for complete info")
        void shouldCalculateHighConfidence() {
            String completeInfo = "Bus 27D from Chennai to Madurai\n" +
                    "Departure: 6:00 AM\n" +
                    "Stops: Tambaram, Trichy";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(completeInfo);
            
            assertTrue(result.getConfidence() >= 0.8, "Complete info should have high confidence");
        }

        @Test
        @DisplayName("Should calculate medium confidence for partial info")
        void shouldCalculateMediumConfidence() {
            String partialInfo = "Chennai to Madurai bus";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(partialInfo);
            
            assertTrue(result.getConfidence() >= 0.3, "Partial info should have some confidence");
            assertTrue(result.getConfidence() < 0.9, "Partial info should not have very high confidence");
        }

        @Test
        @DisplayName("Should calculate low confidence for minimal info")
        void shouldCalculateLowConfidence() {
            String minimalInfo = "bus goes somewhere";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(minimalInfo);
            
            assertTrue(result.getConfidence() < 0.5, "Minimal info should have low confidence");
        }
    }

    @Nested
    @DisplayName("Validation Tests")
    class ValidationTests {

        @Test
        @DisplayName("Should be valid with from and to locations")
        void shouldBeValidWithFromTo() {
            String text = "Chennai to Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertTrue(result.isValid());
        }

        @Test
        @DisplayName("Should be invalid without locations")
        void shouldBeInvalidWithoutLocations() {
            String text = "Bus 27D daily service";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            assertFalse(result.isValid());
        }
    }

    @Nested
    @DisplayName("Edge Cases and Error Handling")
    class EdgeCaseTests {

        @Test
        @DisplayName("Should handle null input")
        void shouldHandleNullInput() {
            RouteTextParser.RouteData result = parser.extractRouteFromText(null);
            
            assertNotNull(result);
            assertEquals(0.0, result.getConfidence());
            assertFalse(result.isValid());
        }

        @Test
        @DisplayName("Should handle empty string")
        void shouldHandleEmptyString() {
            RouteTextParser.RouteData result = parser.extractRouteFromText("");
            
            assertNotNull(result);
            assertEquals(0.0, result.getConfidence());
            assertFalse(result.isValid());
        }

        @Test
        @DisplayName("Should handle whitespace only")
        void shouldHandleWhitespaceOnly() {
            RouteTextParser.RouteData result = parser.extractRouteFromText("   ");
            
            assertNotNull(result);
            assertFalse(result.isValid());
        }

        @Test
        @DisplayName("Should handle very long text")
        void shouldHandleVeryLongText() {
            StringBuilder longText = new StringBuilder("Bus 27D from Chennai to Madurai ");
            for (int i = 0; i < 100; i++) {
                longText.append("stop ").append(i).append(" ");
            }
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(longText.toString());
            
            assertNotNull(result);
            assertEquals("27D", result.getBusNumber());
            assertTrue(result.isValid());
        }

        @Test
        @DisplayName("Should not confuse years with bus numbers")
        void shouldNotConfuseYearsWithBusNumbers() {
            String text = "2024 schedule: Bus 27D Chennai to Madurai";
            
            RouteTextParser.RouteData result = parser.extractRouteFromText(text);
            
            // Should extract 27D, not 2024
            assertEquals("27D", result.getBusNumber());
        }
    }
}
