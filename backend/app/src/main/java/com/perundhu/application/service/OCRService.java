package com.perundhu.application.service;

import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import com.perundhu.domain.model.RouteContribution;

/**
 * Service for optical character recognition (OCR) on bus schedule images
 */
@Service
public class OCRService {
    
    private static final Logger log = LoggerFactory.getLogger(OCRService.class);

    /**
     * Default constructor as there are no dependencies to inject
     */
    public OCRService() {
        // No dependencies to inject
    }

    /**
     * Extract text from an image using OCR
     * 
     * @param imageUrl URL or path to the image file
     * @return Extracted text from the image
     */
    public String extractTextFromImage(String imageUrl) {
        log.info("Extracting text from image: {}", imageUrl);
        
        // In a real implementation, this would use Google Cloud Vision API or Tesseract OCR
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
        
        // Initialize variables to hold parsed data
        String busNumber = "Unknown";
        String busName = "Express Bus";
        String fromLocationName = null;
        String toLocationName = null;
        String departureTime = "08:00";
        String arrivalTime = "12:00";

        // Extract bus number
        Pattern busNumberPattern = Pattern.compile("Bus\\s+(?:Number|No|#)\\s*:?\\s*([A-Z0-9\\-]+)", 
            Pattern.CASE_INSENSITIVE);
        Matcher busNumberMatcher = busNumberPattern.matcher(text);
        if (busNumberMatcher.find()) {
            busNumber = busNumberMatcher.group(1).trim();
        } else {
            log.warn("Could not extract bus number from text");
        }
        
        // Extract bus name
        Pattern busNamePattern = Pattern.compile("Bus\\s+(?:Name)\\s*:?\\s*([\\w\\s]+?)(?:\\n|\\r|$)", 
            Pattern.CASE_INSENSITIVE);
        Matcher busNameMatcher = busNamePattern.matcher(text);
        if (busNameMatcher.find()) {
            busName = busNameMatcher.group(1).trim();
        } else {
            log.warn("Could not extract bus name from text");
        }
        
        // Extract source and destination
        Pattern routePattern = Pattern.compile("(?:From|Source)\\s*:?\\s*([\\w\\s]+)\\s+(?:To|Destination)\\s*:?\\s*([\\w\\s]+)", 
            Pattern.CASE_INSENSITIVE);
        Matcher routeMatcher = routePattern.matcher(text);
        
        if (routeMatcher.find()) {
            fromLocationName = routeMatcher.group(1).trim();
            toLocationName = routeMatcher.group(2).trim();
        } else {
            // Try alternate pattern with FROM-TO format
            Pattern altRoutePattern = Pattern.compile("([\\w\\s]+)\\s*-\\s*([\\w\\s]+)", 
                Pattern.CASE_INSENSITIVE);
            Matcher altRouteMatcher = altRoutePattern.matcher(text);
            
            if (altRouteMatcher.find()) {
                fromLocationName = altRouteMatcher.group(1).trim();
                toLocationName = altRouteMatcher.group(2).trim();
            } else {
                log.warn("Could not extract source and destination from text");
                throw new IllegalArgumentException("Could not determine source and destination from schedule");
            }
        }
        
        // Extract departure and arrival times
        Pattern timePattern = Pattern.compile("(?:Departure|Dep)\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)\\s+(?:Arrival|Arr)\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?)", 
            Pattern.CASE_INSENSITIVE);
        Matcher timeMatcher = timePattern.matcher(text);
        
        if (timeMatcher.find()) {
            departureTime = standardizeTime(timeMatcher.group(1).trim());
            arrivalTime = standardizeTime(timeMatcher.group(2).trim());
        } else {
            log.warn("Could not extract departure and arrival times from text");
        }
        
        // Extract stops (if any)
        List<RouteContribution.StopContribution> stops = new ArrayList<>();
        
        Pattern stopsPattern = Pattern.compile("(?:Stop|Station)\\s+(\\d+)\\s*:?\\s*([\\w\\s]+)\\s+(?:Arr\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?))?\\s*(?:Dep\\s*:?\\s*(\\d{1,2}:\\d{2}(?:\\s*[AP]M)?))?", 
            Pattern.CASE_INSENSITIVE);
        Matcher stopsMatcher = stopsPattern.matcher(text);
        
        while (stopsMatcher.find()) {
            int stopOrder = Integer.parseInt(stopsMatcher.group(1).trim());
            String stopName = stopsMatcher.group(2).trim();

            String arrTime = stopsMatcher.group(3);
            String stopArrivalTime = arrTime != null ? standardizeTime(arrTime.trim()) : "00:00";

            String depTime = stopsMatcher.group(4);
            String stopDepartureTime = depTime != null ? standardizeTime(depTime.trim()) : "00:00";

            // Create StopContribution using constructor (assuming it's a record)
            RouteContribution.StopContribution stop = new RouteContribution.StopContribution(
                stopName,
                null, // nameSecondary - not available from OCR
                null, // latitude - not available from OCR
                null, // longitude - not available from OCR
                LocalTime.parse(stopArrivalTime),
                LocalTime.parse(stopDepartureTime),
                stopOrder
            );

            stops.add(stop);
        }
        
        // Convert time strings to LocalTime
        LocalTime depTime = LocalTime.parse(departureTime);
        LocalTime arrTime = LocalTime.parse(arrivalTime);

        // Create RouteContribution using constructor
        RouteContribution contribution = new RouteContribution(
            null, // id - will be generated
            null, // userId - not available from OCR
            busNumber,
            busName,
            fromLocationName,
            toLocationName,
            null, // busNameSecondary
            null, // fromLocationNameSecondary
            null, // toLocationNameSecondary
            null, // sourceLanguage
            null, // fromLatitude - not available from OCR
            null, // fromLongitude - not available from OCR
            null, // toLatitude - not available from OCR
            null, // toLongitude - not available from OCR
            depTime,
            arrTime,
            null, // scheduleInfo
            null, // status - will be set by service
            null, // submissionDate - will be set by service
            null, // processedDate
            null, // additionalNotes
            null, // validationMessage
            stops
        );

        log.info("Successfully parsed schedule information: {} to {} ({})",
            fromLocationName,
            toLocationName,
            busNumber);

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
        return "TAMIL NADU STATE TRANSPORT CORPORATION\n" +
               "BUS SCHEDULE\n\n" +
               "Bus Number: TN-01-1234\n" +
               "Bus Name: Chennai Express\n\n" +
               "From: Chennai\n" +
               "To: Coimbatore\n\n" +
               "Departure: 08:30 AM\n" +
               "Arrival: 03:45 PM\n\n" +
               "STOPS:\n" +
               "Stop 1: Kanchipuram    Arr: 09:30 AM    Dep: 09:35 AM\n" +
               "Stop 2: Vellore        Arr: 11:00 AM    Dep: 11:10 AM\n" +
               "Stop 3: Salem          Arr: 01:15 PM    Dep: 01:30 PM\n";
    }
}

