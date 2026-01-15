package com.perundhu.adapter.in.rest;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.awt.Color;
import java.awt.Font;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Map;

import javax.imageio.ImageIO;

import net.sourceforge.tess4j.ITesseract;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.multipart.MultipartFile;

import com.perundhu.adapter.out.cache.InMemoryImageHashRepository;
import com.perundhu.application.service.AuthenticationService;
import com.perundhu.application.service.ImageContributionProcessingService;
import com.perundhu.application.service.PasteContributionValidator;
import com.perundhu.application.service.RouteTextParser;
import com.perundhu.application.service.TextFormatNormalizer;
import com.perundhu.domain.model.ImageContribution;
import com.perundhu.domain.port.ContributionInputPort;
import com.perundhu.domain.port.GeminiVisionService;
import com.perundhu.domain.port.InputValidationPort;
import com.perundhu.domain.port.SecurityMonitoringPort;
import com.perundhu.infrastructure.security.RecaptchaService;

/**
 * Comprehensive tests for Tesseract OCR validation in ContributionController.
 * Tests the image validation functionality that rejects junk images (selfies,
 * personal photos)
 * and accepts valid bus schedule images.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("ContributionController Tesseract Validation Tests")
class ContributionControllerTesseractTest {

  @Mock
  private ContributionInputPort contributionInputPort;

  @Mock
  private SecurityMonitoringPort securityMonitoringPort;

  @Mock
  private InputValidationPort inputValidationPort;

  @Mock
  private AuthenticationService authenticationService;

  @Mock
  private ImageContributionProcessingService imageProcessingService;

  @Mock
  private RouteTextParser routeTextParser;

  @Mock
  private PasteContributionValidator pasteValidator;

  @Mock
  private TextFormatNormalizer textNormalizer;

  @Mock
  private InMemoryImageHashRepository imageHashRepository;

  @Mock
  private RecaptchaService recaptchaService;

  @Mock
  private GeminiVisionService geminiVisionService;

  @InjectMocks
  private ContributionController contributionController;

  private MockHttpServletRequest httpRequest;
  private Map<String, String> metadata;

  @BeforeEach
  void setUp() {
    httpRequest = new MockHttpServletRequest();
    httpRequest.setRemoteAddr("127.0.0.1");
    httpRequest.addHeader("User-Agent", "Mozilla/5.0");

    metadata = Map.of(
        "description", "Bus schedule image",
        "location", "Chennai",
        "routeName", "166UD");

    // Mock default behaviors
    when(authenticationService.getCurrentUserId()).thenReturn("test-user-123");
    when(securityMonitoringPort.checkRateLimit(any(), any(), anyInt(), anyLong())).thenReturn(true);
    when(recaptchaService.isEnabled()).thenReturn(false);
    when(imageHashRepository.isDuplicate(any())).thenReturn(false);
  }

  @Nested
  @DisplayName("Valid Bus Schedule Images - Should Pass Tesseract Validation")
  class ValidBusScheduleTests {

    @Test
    @DisplayName("Should accept image with full bus schedule (times, routes, locations)")
    void shouldAcceptFullBusSchedule() throws Exception {
      // Create an image with bus schedule content
      MultipartFile imageFile = createImageWithText(
          "Route 166UD Central to Airport\n" +
              "Timings: 06:00  06:30  07:00  07:30  08:00\n" +
              "Stops: Adyar, Mylapore, Saidapet, Guindy\n" +
              "MTC Chennai Bus Service");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-123");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
      assertEquals("contrib-123", response.getBody().get("contributionId"));
      verify(imageProcessingService).processImageContribution(any(), any(), eq("test-user-123"));
    }

    @Test
    @DisplayName("Should accept route board with locations but no times")
    void shouldAcceptRouteBoardWithoutTimes() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "Route 520\n" +
              "Adyar to Avadi\n" +
              "Stops: Central, Mylapore, Koyambedu, Ambattur\n" +
              "Bus Operator: MTC");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-456");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should accept Tamil bus schedule")
    void shouldAcceptTamilBusSchedule() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "நபஸ் 520 ஆத்யார் - அவாடி\n" +
              "06:00 06:30 07:00 08:00\n" +
              "இருமணை: சென்னை சென்ட்ரல், மயிலாப்பூர்");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-tamil");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should accept image with time patterns and route numbers")
    void shouldAcceptImageWithTimesAndRoutes() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "27M 06:00 06:15 06:30\n" +
              "42C 07:00 07:20 07:40\n" +
              "166UD 08:00 08:30 09:00");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-routes");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should accept image with bus stop information")
    void shouldAcceptBusStopInformation() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "BUS STOP - Central Station\n" +
              "Routes available:\n" +
              "27M, 42C, 166UD, 520\n" +
              "Depot: Anna Nagar\n" +
              "Operating Hours: 05:00 - 23:00");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-stop");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }
  }

  @Nested
  @DisplayName("Invalid/Junk Images - Should Reject via Tesseract Validation")
  class InvalidImageTests {

    @Test
    @DisplayName("Should reject selfie/personal photo with no bus content")
    void shouldRejectSelfie() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "smile happy face beautiful day");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
      String message = (String) response.getBody().get("message");
      assertTrue(message.contains("does not appear to contain bus schedule information"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject random document/receipt")
    void shouldRejectReceipt() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "Invoice #12345\n" +
              "Paid on 2024-01-15\n" +
              "Thank you for your purchase");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject image with minimal text")
    void shouldRejectMinimalText() throws Exception {
      MultipartFile imageFile = createImageWithText("Hello");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject completely blank/empty image")
    void shouldRejectBlankImage() throws Exception {
      MultipartFile imageFile = createImageWithText("");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }

    @Test
    @DisplayName("Should reject image with random text but no bus indicators")
    void shouldRejectRandomText() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "Lorem ipsum dolor sit amet consectetur adipiscing elit\n" +
              "sed do eiusmod tempor incididunt ut labore");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }
  }

  @Nested
  @DisplayName("Edge Cases and Boundary Conditions")
  class EdgeCaseTests {

    @Test
    @DisplayName("Should accept image with exactly 2 indicators (minimum required)")
    void shouldAcceptWith2Indicators() throws Exception {
      // Text with route number and location (2 indicators)
      MultipartFile imageFile = createImageWithText(
          "Route 166UD\n" +
              "Central Station to Airport\n" +
              "MTC Bus Service");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-min");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should reject image with only 1 indicator")
    void shouldRejectWith1Indicator() throws Exception {
      // Text with only route number (1 indicator)
      MultipartFile imageFile = createImageWithText("Route 166UD");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should accept image with location keywords in different case")
    void shouldAcceptMixedCaseLocations() throws Exception {
      MultipartFile imageFile = createImageWithText(
          "Route 520 ADYAR to AVADI\n" +
              "Stops: CENTRAL, mylapore, Guindy\n" +
              "Timings: 06:00 07:00 08:00");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-case");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should accept image with sufficient text length even without other indicators")
    void shouldAcceptLongTextWithFewIndicators() throws Exception {
      // Long text with just 1 explicit indicator but meets length requirement
      MultipartFile imageFile = createImageWithText(
          "Bus Service Information for Route 166UD\n" +
              "This route operates between two major locations\n" +
              "providing essential transportation services for daily commuters");

      ImageContribution mockContribution = new ImageContribution();
      mockContribution.setId("contrib-long");
      mockContribution.setStatus("PENDING_REVIEW");

      when(imageProcessingService.processImageContribution(any(), any(), any()))
          .thenReturn(mockContribution);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
    }
  }

  @Nested
  @DisplayName("Error Handling and Graceful Degradation")
  class ErrorHandlingTests {

    @Test
    @DisplayName("Should handle corrupted image gracefully")
    void shouldHandleCorruptedImage() throws Exception {
      // Create invalid image data
      byte[] corruptedData = new byte[] { 0x00, 0x01, 0x02, 0x03 };
      MultipartFile imageFile = new MockMultipartFile(
          "image",
          "corrupted.jpg",
          "image/jpeg",
          corruptedData);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      // Should fail at earlier validation stage (isValidImageFile)
      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should reject invalid file size")
    void shouldRejectInvalidFileSize() throws Exception {
      // Create image smaller than minimum (1KB)
      byte[] tinyData = new byte[500]; // 500 bytes
      MultipartFile imageFile = new MockMultipartFile(
          "image",
          "tiny.jpg",
          "image/jpeg",
          tinyData);

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
    }

    @Test
    @DisplayName("Should reject invalid content type")
    void shouldRejectInvalidContentType() throws Exception {
      MultipartFile imageFile = new MockMultipartFile(
          "image",
          "document.pdf",
          "application/pdf",
          createImageWithText("Some text").getBytes());

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.BAD_REQUEST, response.getStatusCode());
      assertFalse((Boolean) response.getBody().get("success"));
    }
  }

  @Nested
  @DisplayName("Security and Rate Limiting")
  class SecurityTests {

    @Test
    @DisplayName("Should respect rate limiting")
    void shouldRespectRateLimit() throws Exception {
      when(securityMonitoringPort.checkRateLimit(any(), eq("image-contributions"), anyInt(), anyLong()))
          .thenReturn(false);

      MultipartFile imageFile = createImageWithText("Route 166UD Central 06:00");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.TOO_MANY_REQUESTS, response.getStatusCode());
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }

    @Test
    @DisplayName("Should detect duplicate images")
    void shouldDetectDuplicateImages() throws Exception {
      when(imageHashRepository.isDuplicate(any())).thenReturn(true);
      when(imageHashRepository.getContributionId(any())).thenReturn("original-123");

      MultipartFile imageFile = createImageWithText("Route 166UD Central 06:00");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, metadata, httpRequest);

      assertEquals(HttpStatus.CONFLICT, response.getStatusCode());
      String message = (String) response.getBody().get("message");
      assertTrue(message.contains("Duplicate image detected"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }

    @Test
    @DisplayName("Should detect honeypot bot submissions")
    void shouldDetectHoneypotBot() throws Exception {
      Map<String, String> botMetadata = Map.of(
          "website", "http://spam.com",
          "description", "Bus schedule");

      MultipartFile imageFile = createImageWithText("Route 166UD Central 06:00");

      ResponseEntity<Map<String, Object>> response = contributionController
          .submitImageContribution(imageFile, botMetadata, httpRequest);

      // Returns fake success to confuse bot
      assertEquals(HttpStatus.OK, response.getStatusCode());
      assertTrue((Boolean) response.getBody().get("success"));
      verify(imageProcessingService, never()).processImageContribution(any(), any(), any());
    }
  }

  /**
   * Helper method to create a test image with text rendered on it.
   * This simulates what Tesseract would extract from the image.
   */
  private MultipartFile createImageWithText(String text) throws IOException {
    // Create a simple image with text
    int width = 800;
    int height = 600;
    BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);

    Graphics2D g2d = image.createGraphics();

    // White background
    g2d.setColor(Color.WHITE);
    g2d.fillRect(0, 0, width, height);

    // Black text
    g2d.setColor(Color.BLACK);
    g2d.setFont(new Font("Arial", Font.PLAIN, 24));

    // Draw text line by line
    String[] lines = text.split("\n");
    int y = 50;
    for (String line : lines) {
      g2d.drawString(line, 50, y);
      y += 40;
    }

    g2d.dispose();

    // Convert to byte array
    ByteArrayOutputStream baos = new ByteArrayOutputStream();
    ImageIO.write(image, "jpg", baos);
    byte[] imageBytes = baos.toByteArray();

    return new MockMultipartFile(
        "image",
        "test-image.jpg",
        "image/jpeg",
        imageBytes);
  }
}
