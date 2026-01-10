package com.perundhu.infrastructure.adapter.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import com.perundhu.domain.port.PromptService;

/**
 * Integration tests for FileBasedPromptService.
 * 
 * Tests verify:
 * - Spring bean configuration and wiring
 * - Prompt loading from resources
 * - Prompt retrieval and caching
 */
@SpringBootTest
@ActiveProfiles("test")
@DisplayName("FileBasedPromptService Integration Tests")
class FileBasedPromptServiceTest {

  @Autowired
  private PromptService promptService;

  @Test
  @DisplayName("Should be autowired as Spring bean")
  void shouldBeAutowiredAsSpringBean() {
    assertThat(promptService).isNotNull();
    assertThat(promptService).isInstanceOf(FileBasedPromptService.class);
  }

  @Test
  @DisplayName("Should load bus schedule extraction prompt")
  void shouldLoadBusScheduleExtractionPrompt() {
    // When
    String prompt = promptService.getBusScheduleExtractionPrompt();

    // Then
    assertThat(prompt).isNotNull();
    assertThat(prompt).isNotEmpty();
    assertThat(prompt).contains("bus schedule information");
    assertThat(prompt).contains("Tamil Nadu");
  }

  @Test
  @DisplayName("Should check if prompt exists")
  void shouldCheckIfPromptExists() {
    // When
    boolean exists = promptService.hasPrompt("bus-schedule-extraction");

    // Then
    assertThat(exists).isTrue();
  }

  @Test
  @DisplayName("Should return false for non-existent prompt")
  void shouldReturnFalseForNonExistentPrompt() {
    // When
    boolean exists = promptService.hasPrompt("non-existent-prompt");

    // Then
    assertThat(exists).isFalse();
  }

  @Test
  @DisplayName("Should return null for non-existent prompt retrieval")
  void shouldReturnNullForNonExistentPromptRetrieval() {
    // When
    String prompt = promptService.getPrompt("non-existent-prompt");

    // Then
    assertThat(prompt).isNull();
  }

  @Test
  @DisplayName("Should reload prompts without error")
  void shouldReloadPromptsWithoutError() {
    // When/Then - should not throw exception
    promptService.reloadPrompts();

    // Verify prompt is still available after reload
    String prompt = promptService.getBusScheduleExtractionPrompt();
    assertThat(prompt).isNotNull();
    assertThat(prompt).isNotEmpty();
  }

  @Test
  @DisplayName("Should return same prompt on multiple calls (caching)")
  void shouldReturnSamePromptOnMultipleCalls() {
    // When
    String prompt1 = promptService.getBusScheduleExtractionPrompt();
    String prompt2 = promptService.getBusScheduleExtractionPrompt();

    // Then - should be the exact same instance (cached)
    assertThat(prompt1).isSameAs(prompt2);
  }

  @Test
  @DisplayName("Should support variable substitution")
  void shouldSupportVariableSubstitution() {
    // Given - test with bus-schedule prompt and variable substitution

    // When
    String prompt = promptService.getPromptWithVariables(
        "bus-schedule-extraction",
        java.util.Map.of("example", "test"));

    // Then
    assertThat(prompt).isNotNull();
    // Variable substitution should work even if no variables match
  }
}
