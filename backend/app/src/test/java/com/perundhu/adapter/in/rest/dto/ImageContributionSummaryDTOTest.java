package com.perundhu.adapter.in.rest.dto;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.Test;

/**
 * Unit tests for ImageContributionSummaryDTO
 * Validates the builder pattern and ensures all fields are correctly set
 */
public class ImageContributionSummaryDTOTest {

    @Test
    void testBuilderWithAllFields() {
        // Arrange
        String id = "test-id-123";
        String userId = "user-456";
        String imageUrl = "https://example.com/image.jpg";
        String description = "Test bus timing image";
        String location = "Chennai Central";
        String routeName = "Chennai to Bangalore";
        String extractedData = "{\"routes\": []}";
        String status = "APPROVED";
        String validationMessage = "Validated successfully";
        String additionalNotes = "Clear image quality";
        LocalDateTime submissionDate = LocalDateTime.of(2025, 12, 25, 10, 30);
        LocalDateTime processedDate = LocalDateTime.of(2025, 12, 25, 11, 0);
        String imageContentType = "image/jpeg";

        // Act
        ImageContributionSummaryDTO dto = ImageContributionSummaryDTO.builder()
                .id(id)
                .userId(userId)
                .imageUrl(imageUrl)
                .description(description)
                .location(location)
                .routeName(routeName)
                .extractedData(extractedData)
                .status(status)
                .validationMessage(validationMessage)
                .additionalNotes(additionalNotes)
                .submissionDate(submissionDate)
                .processedDate(processedDate)
                .imageContentType(imageContentType)
                .build();

        // Assert
        assertNotNull(dto);
        assertEquals(id, dto.getId());
        assertEquals(userId, dto.getUserId());
        assertEquals(imageUrl, dto.getImageUrl());
        assertEquals(description, dto.getDescription());
        assertEquals(location, dto.getLocation());
        assertEquals(routeName, dto.getRouteName());
        assertEquals(extractedData, dto.getExtractedData());
        assertEquals(status, dto.getStatus());
        assertEquals(validationMessage, dto.getValidationMessage());
        assertEquals(additionalNotes, dto.getAdditionalNotes());
        assertEquals(submissionDate, dto.getSubmissionDate());
        assertEquals(processedDate, dto.getProcessedDate());
        assertEquals(imageContentType, dto.getImageContentType());
    }

    @Test
    void testBuilderWithMinimalFields() {
        // Act - Build with only required/minimal fields
        ImageContributionSummaryDTO dto = ImageContributionSummaryDTO.builder()
                .id("minimal-id")
                .userId("user-123")
                .status("PENDING")
                .build();

        // Assert
        assertNotNull(dto);
        assertEquals("minimal-id", dto.getId());
        assertEquals("user-123", dto.getUserId());
        assertEquals("PENDING", dto.getStatus());
        assertNull(dto.getImageUrl());
        assertNull(dto.getDescription());
        assertNull(dto.getLocation());
    }

    @Test
    void testNoArgsConstructor() {
        // Act
        ImageContributionSummaryDTO dto = new ImageContributionSummaryDTO();

        // Assert
        assertNotNull(dto);
        assertNull(dto.getId());
        assertNull(dto.getUserId());
        assertNull(dto.getStatus());
    }

    @Test
    void testAllArgsConstructor() {
        // Arrange
        LocalDateTime now = LocalDateTime.now();

        // Act
        ImageContributionSummaryDTO dto = new ImageContributionSummaryDTO(
                "id-1", "user-1", "url", "desc", "location", "route",
                "extracted", "PENDING", "validation", "notes",
                now, now, "image/png");

        // Assert
        assertNotNull(dto);
        assertEquals("id-1", dto.getId());
        assertEquals("user-1", dto.getUserId());
        assertEquals("url", dto.getImageUrl());
        assertEquals("desc", dto.getDescription());
        assertEquals("location", dto.getLocation());
        assertEquals("route", dto.getRouteName());
        assertEquals("extracted", dto.getExtractedData());
        assertEquals("PENDING", dto.getStatus());
        assertEquals("validation", dto.getValidationMessage());
        assertEquals("notes", dto.getAdditionalNotes());
        assertEquals(now, dto.getSubmissionDate());
        assertEquals(now, dto.getProcessedDate());
        assertEquals("image/png", dto.getImageContentType());
    }

    @Test
    void testSettersAndGetters() {
        // Arrange
        ImageContributionSummaryDTO dto = new ImageContributionSummaryDTO();
        LocalDateTime timestamp = LocalDateTime.now();

        // Act
        dto.setId("test-id");
        dto.setUserId("test-user");
        dto.setImageUrl("test-url");
        dto.setDescription("test-description");
        dto.setLocation("test-location");
        dto.setRouteName("test-route");
        dto.setExtractedData("test-data");
        dto.setStatus("APPROVED");
        dto.setValidationMessage("test-validation");
        dto.setAdditionalNotes("test-notes");
        dto.setSubmissionDate(timestamp);
        dto.setProcessedDate(timestamp);
        dto.setImageContentType("image/jpeg");

        // Assert
        assertEquals("test-id", dto.getId());
        assertEquals("test-user", dto.getUserId());
        assertEquals("test-url", dto.getImageUrl());
        assertEquals("test-description", dto.getDescription());
        assertEquals("test-location", dto.getLocation());
        assertEquals("test-route", dto.getRouteName());
        assertEquals("test-data", dto.getExtractedData());
        assertEquals("APPROVED", dto.getStatus());
        assertEquals("test-validation", dto.getValidationMessage());
        assertEquals("test-notes", dto.getAdditionalNotes());
        assertEquals(timestamp, dto.getSubmissionDate());
        assertEquals(timestamp, dto.getProcessedDate());
        assertEquals("image/jpeg", dto.getImageContentType());
    }
}
