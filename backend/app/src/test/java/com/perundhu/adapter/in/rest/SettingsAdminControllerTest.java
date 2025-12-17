package com.perundhu.adapter.in.rest;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.perundhu.application.service.SystemSettingsService;
import com.perundhu.domain.model.SystemSetting;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
@DisplayName("Settings Admin Controller Tests")
class SettingsAdminControllerTest {

  private MockMvc mockMvc;
  private ObjectMapper objectMapper;

  @Mock
  private SystemSettingsService settingsService;

  @InjectMocks
  private SettingsAdminController controller;

  private SystemSetting sampleFeatureSetting;
  private SystemSetting sampleSecuritySetting;

  @BeforeEach
  void setUp() {
    mockMvc = MockMvcBuilders.standaloneSetup(controller).build();
    objectMapper = new ObjectMapper();

    sampleFeatureSetting = new SystemSetting(
        1L,
        "feature.share.enabled",
        "true",
        "features",
        "Enable share route functionality",
        LocalDateTime.now().minusDays(1),
        LocalDateTime.now());

    sampleSecuritySetting = new SystemSetting(
        2L,
        "security.maxRequestsPerMinute",
        "60",
        "security",
        "Maximum API requests per minute",
        LocalDateTime.now().minusDays(1),
        LocalDateTime.now());
  }

  @Nested
  @DisplayName("GET Endpoints Tests")
  class GetEndpointsTests {

    @Test
    @DisplayName("Should get all settings")
    void shouldGetAllSettings() throws Exception {
      // Given
      List<SystemSetting> settings = Arrays.asList(sampleFeatureSetting, sampleSecuritySetting);
      when(settingsService.getAllSettings()).thenReturn(settings);

      // When & Then
      mockMvc.perform(get("/api/admin/settings")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$", hasSize(2)))
          .andExpect(jsonPath("$[0].settingKey", is("feature.share.enabled")))
          .andExpect(jsonPath("$[1].settingKey", is("security.maxRequestsPerMinute")));

      verify(settingsService).getAllSettings();
    }

    @Test
    @DisplayName("Should get all settings as map")
    void shouldGetAllSettingsAsMap() throws Exception {
      // Given
      Map<String, String> settingsMap = Map.of(
          "feature.share.enabled", "true",
          "security.maxRequestsPerMinute", "60");
      when(settingsService.getAllSettingsAsMap()).thenReturn(settingsMap);

      // When & Then
      mockMvc.perform(get("/api/admin/settings/map")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.['feature.share.enabled']", is("true")))
          .andExpect(jsonPath("$.['security.maxRequestsPerMinute']", is("60")));
    }

    @Test
    @DisplayName("Should get feature flags")
    void shouldGetFeatureFlags() throws Exception {
      // Given
      Map<String, Boolean> flags = Map.of(
          "enableShareRoute", true,
          "enableAddStops", true,
          "enableReportIssue", false);
      when(settingsService.getFeatureFlags()).thenReturn(flags);

      // When & Then
      mockMvc.perform(get("/api/admin/settings/feature-flags")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.enableShareRoute", is(true)))
          .andExpect(jsonPath("$.enableAddStops", is(true)))
          .andExpect(jsonPath("$.enableReportIssue", is(false)));
    }

    @Test
    @DisplayName("Should get settings by category")
    void shouldGetSettingsByCategory() throws Exception {
      // Given
      when(settingsService.getSettingsByCategory("features"))
          .thenReturn(Arrays.asList(sampleFeatureSetting));

      // When & Then
      mockMvc.perform(get("/api/admin/settings/category/features")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$", hasSize(1)))
          .andExpect(jsonPath("$[0].category", is("features")));
    }

    @Test
    @DisplayName("Should get setting by key")
    void shouldGetSettingByKey() throws Exception {
      // Given
      when(settingsService.getSetting("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureSetting));

      // When & Then
      mockMvc.perform(get("/api/admin/settings/key/feature.share.enabled")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.settingKey", is("feature.share.enabled")))
          .andExpect(jsonPath("$.settingValue", is("true")));
    }

    @Test
    @DisplayName("Should return 404 when setting not found")
    void shouldReturn404WhenSettingNotFound() throws Exception {
      // Given
      when(settingsService.getSetting("nonexistent"))
          .thenReturn(Optional.empty());

      // When & Then
      mockMvc.perform(get("/api/admin/settings/key/nonexistent")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNotFound());
    }
  }

  @Nested
  @DisplayName("PUT Endpoints Tests")
  class PutEndpointsTests {

    @Test
    @DisplayName("Should update single setting")
    void shouldUpdateSingleSetting() throws Exception {
      // Given
      SystemSetting updatedSetting = new SystemSetting(
          1L, "feature.share.enabled", "false",
          "features", "Enable share route functionality",
          LocalDateTime.now().minusDays(1), LocalDateTime.now());
      when(settingsService.updateSetting("feature.share.enabled", "false"))
          .thenReturn(updatedSetting);

      // When & Then
      mockMvc.perform(put("/api/admin/settings/key/feature.share.enabled")
          .contentType(MediaType.APPLICATION_JSON)
          .content("{\"value\": \"false\"}"))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.settingValue", is("false")));

      verify(settingsService).updateSetting("feature.share.enabled", "false");
    }

    @Test
    @DisplayName("Should return 400 when value is missing")
    void shouldReturn400WhenValueIsMissing() throws Exception {
      // When & Then
      mockMvc.perform(put("/api/admin/settings/key/feature.share.enabled")
          .contentType(MediaType.APPLICATION_JSON)
          .content("{}"))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error", is("Value is required")));
    }

    @Test
    @DisplayName("Should return 404 when updating nonexistent setting")
    void shouldReturn404WhenUpdatingNonexistentSetting() throws Exception {
      // Given
      when(settingsService.updateSetting("nonexistent", "value"))
          .thenThrow(new IllegalArgumentException("Setting not found: nonexistent"));

      // When & Then
      mockMvc.perform(put("/api/admin/settings/key/nonexistent")
          .contentType(MediaType.APPLICATION_JSON)
          .content("{\"value\": \"value\"}"))
          .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Should update multiple settings in bulk")
    void shouldUpdateMultipleSettingsInBulk() throws Exception {
      // Given
      Map<String, String> updates = Map.of(
          "feature.share.enabled", "false",
          "feature.addStops.enabled", "true");
      doNothing().when(settingsService).updateSettings(any());

      // When & Then
      mockMvc.perform(put("/api/admin/settings/bulk")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(updates)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success", is(true)))
          .andExpect(jsonPath("$.updatedCount", is(2)));

      verify(settingsService).updateSettings(any());
    }

    @Test
    @DisplayName("Should update feature flags")
    void shouldUpdateFeatureFlags() throws Exception {
      // Given
      Map<String, Boolean> flags = Map.of(
          "enableShareRoute", false,
          "enableAddStops", true);
      Map<String, Boolean> updatedFlags = Map.of(
          "enableShareRoute", false,
          "enableAddStops", true);
      doNothing().when(settingsService).updateFeatureFlags(any());
      when(settingsService.getFeatureFlags()).thenReturn(updatedFlags);

      // When & Then
      mockMvc.perform(put("/api/admin/settings/feature-flags")
          .contentType(MediaType.APPLICATION_JSON)
          .content(objectMapper.writeValueAsString(flags)))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success", is(true)))
          .andExpect(jsonPath("$.flags.enableShareRoute", is(false)))
          .andExpect(jsonPath("$.flags.enableAddStops", is(true)));

      verify(settingsService).updateFeatureFlags(any());
    }
  }

  @Nested
  @DisplayName("POST Endpoints Tests")
  class PostEndpointsTests {

    @Test
    @DisplayName("Should create new setting")
    void shouldCreateNewSetting() throws Exception {
      // Given
      SystemSetting newSetting = new SystemSetting(
          100L, "custom.setting", "custom_value",
          "custom", "A custom setting",
          LocalDateTime.now(), LocalDateTime.now());
      when(settingsService.createSetting("custom.setting", "custom_value", "custom", "A custom setting"))
          .thenReturn(newSetting);

      String requestBody = """
          {
              "key": "custom.setting",
              "value": "custom_value",
              "category": "custom",
              "description": "A custom setting"
          }
          """;

      // When & Then
      mockMvc.perform(post("/api/admin/settings")
          .contentType(MediaType.APPLICATION_JSON)
          .content(requestBody))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.settingKey", is("custom.setting")))
          .andExpect(jsonPath("$.settingValue", is("custom_value")));
    }

    @Test
    @DisplayName("Should return 400 when creating setting without key")
    void shouldReturn400WhenCreatingSettingWithoutKey() throws Exception {
      String requestBody = """
          {
              "value": "custom_value",
              "category": "custom"
          }
          """;

      // When & Then
      mockMvc.perform(post("/api/admin/settings")
          .contentType(MediaType.APPLICATION_JSON)
          .content(requestBody))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error", is("Setting key is required")));
    }

    @Test
    @DisplayName("Should reset all settings to defaults")
    void shouldResetAllSettingsToDefaults() throws Exception {
      // Given
      doNothing().when(settingsService).resetToDefaults();
      when(settingsService.getAllSettingsAsMap()).thenReturn(Map.of(
          "feature.share.enabled", "true"));

      // When & Then
      mockMvc.perform(post("/api/admin/settings/reset")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success", is(true)))
          .andExpect(jsonPath("$.message", is("All settings reset to defaults")));

      verify(settingsService).resetToDefaults();
    }

    @Test
    @DisplayName("Should reset feature flags to defaults")
    void shouldResetFeatureFlagsToDefaults() throws Exception {
      // Given
      doNothing().when(settingsService).resetFeatureFlagsToDefaults();
      when(settingsService.getFeatureFlags()).thenReturn(Map.of(
          "enableShareRoute", true));

      // When & Then
      mockMvc.perform(post("/api/admin/settings/feature-flags/reset")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.success", is(true)))
          .andExpect(jsonPath("$.message", is("Feature flags reset to defaults")));

      verify(settingsService).resetFeatureFlagsToDefaults();
    }
  }

  @Nested
  @DisplayName("DELETE Endpoints Tests")
  class DeleteEndpointsTests {

    @Test
    @DisplayName("Should delete custom setting")
    void shouldDeleteCustomSetting() throws Exception {
      // Given
      doNothing().when(settingsService).deleteSetting("custom.setting");

      // When & Then
      mockMvc.perform(delete("/api/admin/settings/key/custom.setting")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isNoContent());

      verify(settingsService).deleteSetting("custom.setting");
    }

    @Test
    @DisplayName("Should not allow deleting system settings")
    void shouldNotAllowDeletingSystemSettings() throws Exception {
      // When & Then
      mockMvc.perform(delete("/api/admin/settings/key/feature.share.enabled")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error", is("Cannot delete system settings. Use reset instead.")));
    }

    @Test
    @DisplayName("Should not allow deleting security settings")
    void shouldNotAllowDeletingSecuritySettings() throws Exception {
      // When & Then
      mockMvc.perform(delete("/api/admin/settings/key/security.maxRequestsPerMinute")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isBadRequest())
          .andExpect(jsonPath("$.error", is("Cannot delete system settings. Use reset instead.")));
    }
  }

  @Nested
  @DisplayName("Feature Enabled Check Tests")
  class FeatureEnabledCheckTests {

    @Test
    @DisplayName("Should check if feature is enabled")
    void shouldCheckIfFeatureIsEnabled() throws Exception {
      // Given
      when(settingsService.isFeatureEnabled("share")).thenReturn(true);

      // When & Then
      mockMvc.perform(get("/api/admin/settings/feature-enabled")
          .param("feature", "share")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.share", is(true)));
    }

    @Test
    @DisplayName("Should return false for disabled feature")
    void shouldReturnFalseForDisabledFeature() throws Exception {
      // Given
      when(settingsService.isFeatureEnabled("osmIntegration")).thenReturn(false);

      // When & Then
      mockMvc.perform(get("/api/admin/settings/feature-enabled")
          .param("feature", "osmIntegration")
          .contentType(MediaType.APPLICATION_JSON))
          .andExpect(status().isOk())
          .andExpect(jsonPath("$.osmIntegration", is(false)));
    }
  }
}
