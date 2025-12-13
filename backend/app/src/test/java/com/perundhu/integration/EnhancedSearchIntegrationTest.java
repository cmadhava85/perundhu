package com.perundhu.integration;

import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.lessThanOrEqualTo;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.Disabled;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.WebApplicationContext;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.perundhu.application.dto.BusDTO;

@SpringBootTest
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.cloud.compatibility-verifier.enabled=false"
})
@Transactional
class EnhancedSearchIntegrationTest {

  @Autowired
  private WebApplicationContext webApplicationContext;

  @Autowired
  private ObjectMapper objectMapper;

  private MockMvc mockMvc;

  @org.junit.jupiter.api.BeforeEach
  void setUp() {
    this.mockMvc = MockMvcBuilders.webAppContextSetup(this.webApplicationContext).build();
  }

  @Test
  void testEnhancedSearchEndpoint_IntegrationTest() throws Exception {
    // Test the enhanced search endpoint with real data flow
    String response = mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .param("includeContinuing", "true"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    // Parse the response - handle both array and paginated response
    JsonNode jsonNode = objectMapper.readTree(response);
    BusDTO[] buses;

    if (jsonNode.isArray()) {
      buses = objectMapper.readValue(response, BusDTO[].class);
    } else if (jsonNode.has("content")) {
      // Paginated response with content field
      buses = objectMapper.readValue(jsonNode.get("content").toString(), BusDTO[].class);
    } else if (jsonNode.has("items")) {
      // Paginated response with items field
      buses = objectMapper.readValue(jsonNode.get("items").toString(), BusDTO[].class);
    } else {
      fail("Unexpected response format: " + response);
      return;
    }

    // Verify the response structure
    assertNotNull(buses);

    // If we have results, verify they follow the expected format
    if (buses.length > 0) {
      for (BusDTO bus : buses) {
        assertNotNull(bus.id());
        assertNotNull(bus.name());
        assertNotNull(bus.number());
        assertNotNull(bus.operator());

        // Continuing buses should have "(via ...)" in their name
        if (bus.name().contains("(via")) {
          assertTrue(bus.name().matches(".*\\(via \\w+\\).*"));
        }
      }
    }
  }

  @Test
  void testEnhancedSearchEndpoint_WithoutContinuing_IntegrationTest() throws Exception {
    // Test the enhanced search endpoint without continuing buses
    String response = mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .param("includeContinuing", "false"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"))
        .andReturn()
        .getResponse()
        .getContentAsString();

    // Parse the response - handle both array and paginated response
    JsonNode jsonNode = objectMapper.readTree(response);
    BusDTO[] buses;

    if (jsonNode.isArray()) {
      buses = objectMapper.readValue(response, BusDTO[].class);
    } else if (jsonNode.has("content")) {
      // Paginated response with content field
      buses = objectMapper.readValue(jsonNode.get("content").toString(), BusDTO[].class);
    } else if (jsonNode.has("items")) {
      // Paginated response with items field
      buses = objectMapper.readValue(jsonNode.get("items").toString(), BusDTO[].class);
    } else {
      fail("Unexpected response format: " + response);
      return;
    }

    // Verify the response structure
    assertNotNull(buses);

    // Should not include continuing buses (those with "(via ...)" in name)
    for (BusDTO bus : buses) {
      assertFalse(bus.name().contains("(via"),
          "Bus should not be a continuing bus when includeContinuing=false: " + bus.name());
    }
  }

  @Test
  void testEnhancedSearchEndpoint_DefaultIncludeContinuing_IntegrationTest() throws Exception {
    // Test that continuing buses are included by default
    String responseWithDefault = mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "2"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    String responseWithExplicitTrue = mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .param("includeContinuing", "true"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    // Both responses should be identical since default is true
    assertEquals(responseWithDefault, responseWithExplicitTrue);
  }

  @Test
  void testEnhancedSearchEndpoint_PaginationLimit_IntegrationTest() throws Exception {
    // Test that pagination limits are enforced
    mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .param("size", "20")) // Request more than the limit
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.length()").value(lessThanOrEqualTo(10))); // Should be limited to 10
  }

  @Test
  void testEnhancedSearchEndpoint_InvalidParameters_IntegrationTest() throws Exception {
    // Test various invalid parameter combinations

    // Missing fromLocationId
    mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("toLocationId", "2"))
        .andExpect(status().isBadRequest());

    // Missing toLocationId
    mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1"))
        .andExpect(status().isBadRequest());

    // Same from and to location
    mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "1"))
        .andExpect(status().isBadRequest());

    // Invalid location IDs
    mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "invalid")
        .param("toLocationId", "2"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void testBackwardCompatibility_LegacyStringSearch_IntegrationTest() throws Exception {
    // Test that legacy string-based search still works
    mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocation", "Chennai")
        .param("toLocation", "Trichy"))
        .andExpect(status().isOk())
        .andExpect(content().contentType("application/json"));
  }

  @Test
  void testEnhancedSearchEndpoint_DeduplicationWorking_IntegrationTest() throws Exception {
    // This test verifies that duplicate buses are properly removed
    String response = mockMvc.perform(get("/api/v1/bus-schedules/search")
        .param("fromLocationId", "1")
        .param("toLocationId", "2")
        .param("includeContinuing", "true"))
        .andExpect(status().isOk())
        .andReturn()
        .getResponse()
        .getContentAsString();

    // Parse the response - handle both array and paginated response
    JsonNode jsonNode = objectMapper.readTree(response);
    BusDTO[] buses;

    if (jsonNode.isArray()) {
      buses = objectMapper.readValue(response, BusDTO[].class);
    } else if (jsonNode.has("content")) {
      // Paginated response with content field
      buses = objectMapper.readValue(jsonNode.get("content").toString(), BusDTO[].class);
    } else if (jsonNode.has("items")) {
      // Paginated response with items field
      buses = objectMapper.readValue(jsonNode.get("items").toString(), BusDTO[].class);
    } else {
      fail("Unexpected response format: " + response);
      return;
    }

    // Verify no duplicate bus IDs
    java.util.Set<Long> seenIds = new java.util.HashSet<>();
    for (BusDTO bus : buses) {
      assertFalse(seenIds.contains(bus.id()),
          "Duplicate bus ID found: " + bus.id() + " for bus: " + bus.name());
      seenIds.add(bus.id());
    }
  }
}