package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.Mockito.when;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import com.perundhu.adapter.in.rest.dto.ImageContributionSummaryDTO;
import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.domain.model.ImageContribution;

/**
 * Unit tests for AdminController focusing on ImageContributionSummaryDTO usage
 * Tests verify that imageData is properly excluded when converting to DTOs
 */
@ExtendWith(MockitoExtension.class)
public class AdminControllerTest {

    @Mock
    private AdminUseCase adminUseCase;

    @InjectMocks
    private AdminController adminController;

    private ImageContribution sampleImageContribution;
    private List<ImageContribution> sampleImageContributions;

    @BeforeEach
    void setUp() {
        // Create a sample ImageContribution with imageData
        byte[] sampleImageData = new byte[]{0x01, 0x02, 0x03, 0x04}; // Sample binary data
        
        sampleImageContribution = ImageContribution.builder()
                .id("img-123")
                .userId("user-456")
                .imageUrl("https://example.com/image.jpg")
                .description("Bus timing schedule")
                .location("Chennai Central")
                .routeName("Chennai to Bangalore")
                .extractedData("{\"routes\": []}")
                .status("PENDING")
                .validationMessage("Awaiting review")
                .additionalNotes("Clear image")
                .submissionDate(LocalDateTime.of(2025, 12, 25, 10, 0))
                .processedDate(null)
                .imageData(sampleImageData) // This should be excluded in DTO
                .imageContentType("image/jpeg")
                .build();

        ImageContribution secondContribution = ImageContribution.builder()
                .id("img-456")
                .userId("user-789")
                .imageUrl("https://example.com/image2.jpg")
                .description("Another timing image")
                .location("Bangalore")
                .routeName("Bangalore to Mysore")
                .status("APPROVED")
                .submissionDate(LocalDateTime.of(2025, 12, 25, 11, 0))
                .processedDate(LocalDateTime.of(2025, 12, 25, 12, 0))
                .imageData(new byte[]{0x05, 0x06, 0x07}) // This should be excluded in DTO
                .imageContentType("image/png")
                .build();

        sampleImageContributions = Arrays.asList(sampleImageContribution, secondContribution);
    }

    @Test
    void testGetAllImageContributions_ReturnsListOfDTOs() {
        // Arrange
        when(adminUseCase.getAllImageContributions()).thenReturn(sampleImageContributions);

        // Act
        ResponseEntity<List<ImageContributionSummaryDTO>> response = adminController.getAllImageContributions();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        List<ImageContributionSummaryDTO> dtos = response.getBody();
        assertNotNull(dtos);
        assertEquals(2, dtos.size());
    }

    @Test
    void testGetAllImageContributions_ExcludesImageData() {
        // Arrange
        when(adminUseCase.getAllImageContributions()).thenReturn(sampleImageContributions);

        // Act
        ResponseEntity<List<ImageContributionSummaryDTO>> response = adminController.getAllImageContributions();

        // Assert
        List<ImageContributionSummaryDTO> dtos = response.getBody();
        assertNotNull(dtos);
        
        // Verify first DTO
        ImageContributionSummaryDTO firstDto = dtos.get(0);
        assertEquals("img-123", firstDto.getId());
        assertEquals("user-456", firstDto.getUserId());
        assertEquals("https://example.com/image.jpg", firstDto.getImageUrl());
        assertEquals("Bus timing schedule", firstDto.getDescription());
        assertEquals("Chennai Central", firstDto.getLocation());
        assertEquals("Chennai to Bangalore", firstDto.getRouteName());
        assertEquals("{\"routes\": []}", firstDto.getExtractedData());
        assertEquals("PENDING", firstDto.getStatus());
        assertEquals("Awaiting review", firstDto.getValidationMessage());
        assertEquals("Clear image", firstDto.getAdditionalNotes());
        assertEquals(LocalDateTime.of(2025, 12, 25, 10, 0), firstDto.getSubmissionDate());
        assertNull(firstDto.getProcessedDate());
        assertEquals("image/jpeg", firstDto.getImageContentType());
        
        // Note: ImageContributionSummaryDTO doesn't have an imageData field,
        // which is the whole point - it excludes binary data for lightweight responses
    }

    @Test
    void testGetAllImageContributions_VerifiesFieldMapping() {
        // Arrange
        when(adminUseCase.getAllImageContributions()).thenReturn(sampleImageContributions);

        // Act
        ResponseEntity<List<ImageContributionSummaryDTO>> response = adminController.getAllImageContributions();

        // Assert
        List<ImageContributionSummaryDTO> dtos = response.getBody();
        assertNotNull(dtos);
        
        // Verify second DTO has correct mapping
        ImageContributionSummaryDTO secondDto = dtos.get(1);
        assertEquals("img-456", secondDto.getId());
        assertEquals("user-789", secondDto.getUserId());
        assertEquals("https://example.com/image2.jpg", secondDto.getImageUrl());
        assertEquals("Another timing image", secondDto.getDescription());
        assertEquals("Bangalore", secondDto.getLocation());
        assertEquals("Bangalore to Mysore", secondDto.getRouteName());
        assertEquals("APPROVED", secondDto.getStatus());
        assertEquals(LocalDateTime.of(2025, 12, 25, 11, 0), secondDto.getSubmissionDate());
        assertEquals(LocalDateTime.of(2025, 12, 25, 12, 0), secondDto.getProcessedDate());
        assertEquals("image/png", secondDto.getImageContentType());
    }

    @Test
    void testGetPendingImageContributions_ReturnsOnlyPending() {
        // Arrange
        ImageContribution pendingContribution = ImageContribution.builder()
                .id("pending-123")
                .userId("user-111")
                .imageUrl("https://example.com/pending.jpg")
                .status("PENDING")
                .submissionDate(LocalDateTime.now())
                .imageData(new byte[]{0x01}) // Should be excluded
                .imageContentType("image/jpeg")
                .build();
        
        when(adminUseCase.getPendingImageContributions()).thenReturn(Arrays.asList(pendingContribution));

        // Act
        ResponseEntity<List<ImageContributionSummaryDTO>> response = adminController.getPendingImageContributions();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        List<ImageContributionSummaryDTO> dtos = response.getBody();
        assertNotNull(dtos);
        assertEquals(1, dtos.size());
        
        ImageContributionSummaryDTO dto = dtos.get(0);
        assertEquals("pending-123", dto.getId());
        assertEquals("PENDING", dto.getStatus());
        assertEquals("image/jpeg", dto.getImageContentType());
    }

    @Test
    void testGetPendingImageContributions_HandlesEmptyList() {
        // Arrange
        when(adminUseCase.getPendingImageContributions()).thenReturn(Arrays.asList());

        // Act
        ResponseEntity<List<ImageContributionSummaryDTO>> response = adminController.getPendingImageContributions();

        // Assert
        assertNotNull(response);
        assertEquals(HttpStatus.OK, response.getStatusCode());
        
        List<ImageContributionSummaryDTO> dtos = response.getBody();
        assertNotNull(dtos);
        assertEquals(0, dtos.size());
    }

    @Test
    void testConvertToSummaryDTO_HandlesNullFields() {
        // Arrange
        ImageContribution minimalContribution = ImageContribution.builder()
                .id("minimal-123")
                .userId("user-minimal")
                .status("PENDING")
                .imageData(new byte[]{0x01, 0x02}) // Should be excluded
                .build();
        
        when(adminUseCase.getAllImageContributions()).thenReturn(Arrays.asList(minimalContribution));

        // Act
        ResponseEntity<List<ImageContributionSummaryDTO>> response = adminController.getAllImageContributions();

        // Assert
        List<ImageContributionSummaryDTO> dtos = response.getBody();
        assertNotNull(dtos);
        assertEquals(1, dtos.size());
        
        ImageContributionSummaryDTO dto = dtos.get(0);
        assertEquals("minimal-123", dto.getId());
        assertEquals("user-minimal", dto.getUserId());
        assertEquals("PENDING", dto.getStatus());
        assertNull(dto.getImageUrl());
        assertNull(dto.getDescription());
        assertNull(dto.getLocation());
        assertNull(dto.getRouteName());
        assertNull(dto.getExtractedData());
        assertNull(dto.getValidationMessage());
        assertNull(dto.getAdditionalNotes());
        assertNull(dto.getSubmissionDate());
        assertNull(dto.getProcessedDate());
        assertNull(dto.getImageContentType());
    }
}
