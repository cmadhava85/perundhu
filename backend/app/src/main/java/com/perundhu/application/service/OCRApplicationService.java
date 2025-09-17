package com.perundhu.application.service;

import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.perundhu.domain.model.RouteContribution;
import com.perundhu.domain.model.StopContribution;

import lombok.RequiredArgsConstructor;

/**
 * Application service for OCR-related operations on bus schedule images
 * This is a legacy service that should be refactored or removed in favor of the
 * domain interface implementation
 */
@Service("legacyOCRService")
@RequiredArgsConstructor
public class OCRApplicationService {

    private static final Logger log = LoggerFactory.getLogger(OCRApplicationService.class);

    /**
     * Extract text from an image using OCR
     * 
     * @param imageUrl URL or path to the image file
     * @return Extracted text from the image
     */
    public String extractTextFromImage(String imageUrl) {
        log.info("Extracting text from image: {}", imageUrl);

        // In a real implementation, this would use Google Cloud Vision API or Tesseract
        // OCR
        // For demonstration purposes, we'll simulate OCR with sample text

        // Simulate OCR processing delay
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // For demonstration, return simulated text based on the image URL
        if (imageUrl.contains("error") || imageUrl.contains("fail")) {
            log.warn("Failed to extract text from image: {}", imageUrl);
            return "";
        }

        // Return simulated bus schedule text
        log.info("Successfully extracted text from image");
        return generateSampleScheduleText();
    }

    /**
     * Parse schedule text to identify bus route details
     * 
     * @param text The OCR-extracted text
     * @return A RouteContribution object with the parsed information
     */
    public RouteContribution parseScheduleText(String text) {
        log.info("Parsing extracted schedule text: {}", text.substring(0, Math.min(100, text.length())));

        RouteContribution contribution = new RouteContribution();

        // Extract bus number
        Pattern busNumberPattern = Pattern.compile("Bus\\s+(?:Number|No|#)\\s*:?\\s*([A-Z0-9\\-]+)",
                Pattern.CASE_INSENSITIVE);
        Matcher busNumberMatcher = busNumberPattern.matcher(text);
        if (busNumberMatcher.find()) {
            contribution.setBusNumber(busNumberMatcher.group(1).trim());
        } else {
            log.warn("Could not extract bus number from text");
            contribution.setBusNumber("Unknown");
        }

        // Extract bus name
        Pattern busNamePattern = Pattern.compile("Bus\\s+(?:Name)\\s*:?\\s*([\\w\\s]+?)(?:\\n|\\r|$)",
                Pattern.CASE_INSENSITIVE);
        Matcher busNameMatcher = busNamePattern.matcher(text);
        if (busNameMatcher.find()) {
            contribution.setBusName(busNameMatcher.group(1).trim());
        } else {
            log.warn("Could not extract bus name from text");
            contribution.setBusName("Express Bus");
        }

        // Extract source and destination
        Pattern routePattern = Pattern.compile(
                "(?:From|Source)\\s*:?\\s*([\\w\\s]+)\\s+(?:To|Destination)\\s*:?\\s*([\\w\\s]+)",
                Pattern.CASE_INSENSITIVE);
        Matcher routeMatcher = routePattern.matcher(text);

        if (routeMatcher.find()) {
            contribution.setFromLocationName(routeMatcher.group(1).trim());
            contribution.setToLocationName(routeMatcher.group(2).trim());
        } else {
            // Try alternate pattern with FROM-TO format
            Pattern altRoutePattern = Pattern.compile("([\\w\\s]+)\\s*-\\s*([\\w\\s]+)",
                    Pattern.CASE_INSENSITIVE);
            Matcher altRouteMatcher = altRoutePattern.matcher(text);

            if (altRouteMatcher.find()) {
                contribution.setFromLocationName(altRouteMatcher.group(1).trim());
                contribution.setToLocationName(altRouteMatcher.group(2).trim());
            } else {
                log.warn("Could not extract source and destination from text");
                throw new IllegalArgumentException("Could not determine source and destination from schedule");
            }
        }

        // Extract departure and arrival times
        Pattern timePattern = Pattern.compile(
                "(?:Departure|Dep)\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)\\s+(?:Arrival|Arr)\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)",
                Pattern.CASE_INSENSITIVE);
        Matcher timeMatcher = timePattern.matcher(text);

        if (timeMatcher.find()) {
            contribution.setDepartureTime(standardizeTime(timeMatcher.group(1).trim()));
            contribution.setArrivalTime(standardizeTime(timeMatcher.group(2).trim()));
        } else {
            log.warn("Could not extract departure and arrival times from text");
            contribution.setDepartureTime("08:00");
            contribution.setArrivalTime("12:00");
        }

        // Extract stops (if any)
        List<StopContribution> stops = new ArrayList<>();

        Pattern stopsPattern = Pattern.compile(
                "(?:Stop|Station)\\s+(\\d+)\\s*:?\\s*([\\w\\s]+)\\s+(?:Arr\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?))?\\s*(?:Dep\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?))?",
                Pattern.CASE_INSENSITIVE);
        Matcher stopsMatcher = stopsPattern.matcher(text);

        while (stopsMatcher.find()) {
            StopContribution stop = new StopContribution();
            stop.setStopOrder(Integer.parseInt(stopsMatcher.group(1).trim()));
            stop.setName(stopsMatcher.group(2).trim());

            String arrTime = stopsMatcher.group(3);
            if (arrTime != null) {
                stop.setArrivalTime(standardizeTime(arrTime.trim()));
            } else {
                stop.setArrivalTime("00:00"); // Default
            }

            String depTime = stopsMatcher.group(4);
            if (depTime != null) {
                stop.setDepartureTime(standardizeTime(depTime.trim()));
            } else {
                stop.setDepartureTime("00:00"); // Default
            }

            stops.add(stop);
        }

        contribution.setStops(stops);
        log.info("Successfully parsed schedule information: {} to {} ({})",
                contribution.getFromLocationName(),
                contribution.getToLocationName(),
                contribution.getBusNumber());

        return contribution;
    }

    /**
     * Convert time strings to standard 24-hour format (HH:MM)
     */
    private String standardizeTime(String timeStr) {
        timeStr = timeStr.toUpperCase().trim();

        // Try to parse time with different formats
        try {
            // Check if AM/PM is present
            if (timeStr.endsWith("AM") || timeStr.endsWith("PM")) {
                DateTimeFormatter inputFormat = DateTimeFormatter.ofPattern("h:mm a");
                if (timeStr.contains(".")) {
                    inputFormat = DateTimeFormatter.ofPattern("h.mm a");
                }
                LocalTime time = LocalTime.parse(timeStr, inputFormat);
                return time.format(DateTimeFormatter.ofPattern("HH:mm"));
            } else {
                // Already in 24-hour format
                DateTimeFormatter inputFormat = DateTimeFormatter.ofPattern("H:mm");
                if (timeStr.contains(".")) {
                    inputFormat = DateTimeFormatter.ofPattern("H.mm");
                }
                LocalTime time = LocalTime.parse(timeStr, inputFormat);
                return time.format(DateTimeFormatter.ofPattern("HH:mm"));
            }
        } catch (DateTimeParseException e) {
            log.warn("Could not parse time: {}", timeStr);
            return "00:00"; // Default time
        }
    }

    /**
     * Generate sample schedule text for demonstration purposes
     */
    private String generateSampleScheduleText() {
        return """
                TAMIL NADU STATE TRANSPORT CORPORATION
                BUS SCHEDULE

                Bus Number: TN-01-1234
                Bus Name: Chennai Express

                From: Chennai
                To: Coimbatore

                Departure: 08:30 AM
                Arrival: 03:45 PM

                STOPS:
                Stop 1: Kanchipuram    Arr: 09:30 AM    Dep: 09:35 AM
                Stop 2: Vellore        Arr: 11:00 AM    Dep: 11:10 AM
                Stop 3: Salem          Arr: 01:15 PM    Dep: 01:30 PM
                """;
    }

    /**
     * Get supported image formats
     */
    public List<String> getSupportedFormats() {
        return List.of("JPEG", "PNG", "TIFF", "BMP");
    }
}