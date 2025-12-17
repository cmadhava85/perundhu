package com.perundhu.application.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import com.perundhu.domain.model.SystemSetting;
import com.perundhu.domain.port.SystemSettingPort;

@ExtendWith(MockitoExtension.class)
@DisplayName("System Settings Service Tests")
class SystemSettingsServiceTest {

  @Mock
  private SystemSettingPort settingPort;

  @InjectMocks
  private SystemSettingsService settingsService;

  private SystemSetting sampleFeatureFlagSetting;
  private SystemSetting sampleSecuritySetting;

  @BeforeEach
  void setUp() {
    sampleFeatureFlagSetting = new SystemSetting(
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
  @DisplayName("Get Settings Tests")
  class GetSettingsTests {

    @Test
    @DisplayName("Should get all settings")
    void shouldGetAllSettings() {
      // Given
      List<SystemSetting> settings = Arrays.asList(sampleFeatureFlagSetting, sampleSecuritySetting);
      when(settingPort.findAllOrderedByCategoryAndKey()).thenReturn(settings);

      // When
      List<SystemSetting> result = settingsService.getAllSettings();

      // Then
      assertThat(result).hasSize(2);
      assertThat(result.get(0).getSettingKey()).isEqualTo("feature.share.enabled");
      assertThat(result.get(1).getSettingKey()).isEqualTo("security.maxRequestsPerMinute");
      verify(settingPort).findAllOrderedByCategoryAndKey();
    }

    @Test
    @DisplayName("Should get all settings as map")
    void shouldGetAllSettingsAsMap() {
      // Given
      when(settingPort.findAll())
          .thenReturn(Arrays.asList(sampleFeatureFlagSetting, sampleSecuritySetting));

      // When
      Map<String, String> result = settingsService.getAllSettingsAsMap();

      // Then
      assertThat(result).hasSize(2);
      assertThat(result.get("feature.share.enabled")).isEqualTo("true");
      assertThat(result.get("security.maxRequestsPerMinute")).isEqualTo("60");
    }

    @Test
    @DisplayName("Should get feature flags")
    void shouldGetFeatureFlags() {
      // Given
      when(settingPort.findBySettingKeyStartingWith("feature."))
          .thenReturn(Arrays.asList(sampleFeatureFlagSetting));

      // When
      Map<String, Boolean> result = settingsService.getFeatureFlags();

      // Then
      assertThat(result).isNotEmpty();
      assertThat(result.get("enableShareRoute")).isTrue();
    }

    @Test
    @DisplayName("Should get settings by category")
    void shouldGetSettingsByCategory() {
      // Given
      when(settingPort.findByCategory("features"))
          .thenReturn(Arrays.asList(sampleFeatureFlagSetting));

      // When
      List<SystemSetting> result = settingsService.getSettingsByCategory("features");

      // Then
      assertThat(result).hasSize(1);
      assertThat(result.get(0).getCategory()).isEqualTo("features");
    }

    @Test
    @DisplayName("Should get setting by key")
    void shouldGetSettingByKey() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));

      // When
      Optional<SystemSetting> result = settingsService.getSetting("feature.share.enabled");

      // Then
      assertThat(result).isPresent();
      assertThat(result.get().getSettingKey()).isEqualTo("feature.share.enabled");
      assertThat(result.get().getSettingValue()).isEqualTo("true");
    }

    @Test
    @DisplayName("Should return empty when setting not found")
    void shouldReturnEmptyWhenSettingNotFound() {
      // Given
      when(settingPort.findBySettingKey("nonexistent"))
          .thenReturn(Optional.empty());

      // When
      Optional<SystemSetting> result = settingsService.getSetting("nonexistent");

      // Then
      assertThat(result).isEmpty();
    }
  }

  @Nested
  @DisplayName("Get Typed Values Tests")
  class GetTypedValuesTests {

    @Test
    @DisplayName("Should get setting value with default fallback")
    void shouldGetSettingValueWithDefault() {
      // Given
      when(settingPort.findBySettingKey("nonexistent"))
          .thenReturn(Optional.empty());

      // When
      String result = settingsService.getSettingValue("nonexistent", "default_value");

      // Then
      assertThat(result).isEqualTo("default_value");
    }

    @Test
    @DisplayName("Should get boolean setting as true")
    void shouldGetBooleanSettingAsTrue() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));

      // When
      boolean result = settingsService.getBooleanSetting("feature.share.enabled", false);

      // Then
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should get boolean setting as false")
    void shouldGetBooleanSettingAsFalse() {
      // Given
      SystemSetting falseSetting = sampleFeatureFlagSetting.withValue("false");
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(falseSetting));

      // When
      boolean result = settingsService.getBooleanSetting("feature.share.enabled", true);

      // Then
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return default boolean when setting not found")
    void shouldReturnDefaultBooleanWhenNotFound() {
      // Given
      when(settingPort.findBySettingKey("nonexistent"))
          .thenReturn(Optional.empty());

      // When
      boolean result = settingsService.getBooleanSetting("nonexistent", true);

      // Then
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should get integer setting")
    void shouldGetIntegerSetting() {
      // Given
      when(settingPort.findBySettingKey("security.maxRequestsPerMinute"))
          .thenReturn(Optional.of(sampleSecuritySetting));

      // When
      int result = settingsService.getIntSetting("security.maxRequestsPerMinute", 30);

      // Then
      assertThat(result).isEqualTo(60);
    }

    @Test
    @DisplayName("Should return default integer when parsing fails")
    void shouldReturnDefaultIntegerWhenParsingFails() {
      // Given
      SystemSetting invalidSetting = sampleSecuritySetting.withValue("not_a_number");
      when(settingPort.findBySettingKey("security.maxRequestsPerMinute"))
          .thenReturn(Optional.of(invalidSetting));

      // When
      int result = settingsService.getIntSetting("security.maxRequestsPerMinute", 30);

      // Then
      assertThat(result).isEqualTo(30);
    }

    @Test
    @DisplayName("Should return default integer when setting not found")
    void shouldReturnDefaultIntegerWhenNotFound() {
      // Given
      when(settingPort.findBySettingKey("nonexistent"))
          .thenReturn(Optional.empty());

      // When
      int result = settingsService.getIntSetting("nonexistent", 100);

      // Then
      assertThat(result).isEqualTo(100);
    }
  }

  @Nested
  @DisplayName("Update Settings Tests")
  class UpdateSettingsTests {

    @Test
    @DisplayName("Should update setting value")
    void shouldUpdateSettingValue() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      SystemSetting result = settingsService.updateSetting("feature.share.enabled", "false");

      // Then
      assertThat(result.getSettingValue()).isEqualTo("false");
      verify(settingPort).save(any(SystemSetting.class));
    }

    @Test
    @DisplayName("Should throw exception when updating nonexistent setting")
    void shouldThrowExceptionWhenUpdatingNonexistentSetting() {
      // Given
      when(settingPort.findBySettingKey("nonexistent"))
          .thenReturn(Optional.empty());

      // When & Then
      assertThatThrownBy(() -> settingsService.updateSetting("nonexistent", "value"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Setting not found: nonexistent");
    }

    @Test
    @DisplayName("Should update multiple settings")
    void shouldUpdateMultipleSettings() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      Map<String, String> updates = Map.of("enableShareRoute", "false");

      // When
      settingsService.updateSettings(updates);

      // Then
      verify(settingPort).save(any(SystemSetting.class));
    }

    @Test
    @DisplayName("Should update feature flags")
    void shouldUpdateFeatureFlags() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      Map<String, Boolean> flags = Map.of("enableShareRoute", false);

      // When
      settingsService.updateFeatureFlags(flags);

      // Then
      ArgumentCaptor<SystemSetting> captor = ArgumentCaptor.forClass(SystemSetting.class);
      verify(settingPort).save(captor.capture());
      assertThat(captor.getValue().getSettingValue()).isEqualTo("false");
    }
  }

  @Nested
  @DisplayName("Create Setting Tests")
  class CreateSettingTests {

    @Test
    @DisplayName("Should create new setting")
    void shouldCreateNewSetting() {
      // Given
      when(settingPort.existsBySettingKey("custom.setting"))
          .thenReturn(false);
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> {
            SystemSetting setting = invocation.getArgument(0);
            return new SystemSetting(
                100L,
                setting.getSettingKey(),
                setting.getSettingValue(),
                setting.getCategory(),
                setting.getDescription(),
                setting.getCreatedAt(),
                setting.getUpdatedAt());
          });

      // When
      SystemSetting result = settingsService.createSetting(
          "custom.setting", "custom_value", "custom", "A custom setting");

      // Then
      assertThat(result.getSettingKey()).isEqualTo("custom.setting");
      assertThat(result.getSettingValue()).isEqualTo("custom_value");
      assertThat(result.getCategory()).isEqualTo("custom");
      verify(settingPort).save(any(SystemSetting.class));
    }

    @Test
    @DisplayName("Should throw exception when setting already exists")
    void shouldThrowExceptionWhenSettingAlreadyExists() {
      // Given
      when(settingPort.existsBySettingKey("existing.setting"))
          .thenReturn(true);

      // When & Then
      assertThatThrownBy(() -> settingsService.createSetting(
          "existing.setting", "value", "category", "description"))
          .isInstanceOf(IllegalArgumentException.class)
          .hasMessageContaining("Setting already exists: existing.setting");
    }
  }

  @Nested
  @DisplayName("Delete Setting Tests")
  class DeleteSettingTests {

    @Test
    @DisplayName("Should delete setting by key")
    void shouldDeleteSettingByKey() {
      // When
      settingsService.deleteSetting("custom.setting");

      // Then
      verify(settingPort).deleteBySettingKey("custom.setting");
    }
  }

  @Nested
  @DisplayName("Reset Tests")
  class ResetTests {

    @Test
    @DisplayName("Should reset to defaults")
    void shouldResetToDefaults() {
      // Given
      when(settingPort.findBySettingKey(anyString()))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      settingsService.resetToDefaults();

      // Then - verify that save was called for each default setting
      verify(settingPort, times(19)).findBySettingKey(anyString());
    }

    @Test
    @DisplayName("Should reset feature flags to defaults only")
    void shouldResetFeatureFlagsToDefaultsOnly() {
      // Given
      when(settingPort.findBySettingKey(anyString()))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      settingsService.resetFeatureFlagsToDefaults();

      // Then - verify only feature settings are queried (12 feature flags)
      verify(settingPort, times(12)).findBySettingKey(anyString());
    }
  }

  @Nested
  @DisplayName("Feature Check Tests")
  class FeatureCheckTests {

    @Test
    @DisplayName("Should check if feature is enabled")
    void shouldCheckIfFeatureIsEnabled() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));

      // When
      boolean result = settingsService.isFeatureEnabled("share.enabled");

      // Then
      assertThat(result).isTrue();
    }

    @Test
    @DisplayName("Should return false for disabled feature")
    void shouldReturnFalseForDisabledFeature() {
      // Given
      SystemSetting disabledSetting = sampleFeatureFlagSetting.withValue("false");
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(disabledSetting));

      // When
      boolean result = settingsService.isFeatureEnabled("share.enabled");

      // Then
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should return false for nonexistent feature")
    void shouldReturnFalseForNonexistentFeature() {
      // Given
      when(settingPort.findBySettingKey("feature.nonexistent"))
          .thenReturn(Optional.empty());

      // When
      boolean result = settingsService.isFeatureEnabled("nonexistent");

      // Then
      assertThat(result).isFalse();
    }

    @Test
    @DisplayName("Should handle feature key with prefix")
    void shouldHandleFeatureKeyWithPrefix() {
      // Given
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(sampleFeatureFlagSetting));

      // When
      boolean result = settingsService.isFeatureEnabled("feature.share.enabled");

      // Then
      assertThat(result).isTrue();
    }
  }

  @Nested
  @DisplayName("Initialization Tests")
  class InitializationTests {

    @Test
    @DisplayName("Should not create setting if it already exists")
    void shouldNotCreateSettingIfAlreadyExists() {
      // Given
      when(settingPort.existsBySettingKey(anyString())).thenReturn(true);

      // When
      settingsService.initializeDefaultSettings();

      // Then
      verify(settingPort, never()).save(any(SystemSetting.class));
    }

    @Test
    @DisplayName("Should create default settings on initialization")
    void shouldCreateDefaultSettingsOnInitialization() {
      // Given
      when(settingPort.existsBySettingKey(anyString())).thenReturn(false);
      when(settingPort.save(any(SystemSetting.class)))
          .thenAnswer(invocation -> invocation.getArgument(0));

      // When
      settingsService.initializeDefaultSettings();

      // Then - 19 default settings
      verify(settingPort, times(19)).save(any(SystemSetting.class));
    }
  }

  @Nested
  @DisplayName("Edge Cases")
  class EdgeCases {

    @Test
    @DisplayName("Should handle empty settings list")
    void shouldHandleEmptySettingsList() {
      // Given
      when(settingPort.findAllOrderedByCategoryAndKey())
          .thenReturn(List.of());

      // When
      List<SystemSetting> result = settingsService.getAllSettings();

      // Then
      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should handle empty feature flags list")
    void shouldHandleEmptyFeatureFlagsList() {
      // Given
      when(settingPort.findBySettingKeyStartingWith("feature."))
          .thenReturn(List.of());

      // When
      Map<String, Boolean> result = settingsService.getFeatureFlags();

      // Then
      assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("Should handle case-insensitive boolean values")
    void shouldHandleCaseInsensitiveBooleanValues() {
      // Given
      SystemSetting uppercaseSetting = sampleFeatureFlagSetting.withValue("TRUE");
      when(settingPort.findBySettingKey("feature.share.enabled"))
          .thenReturn(Optional.of(uppercaseSetting));

      // When
      boolean result = settingsService.getBooleanSetting("feature.share.enabled", false);

      // Then
      assertThat(result).isTrue();
    }
  }
}
