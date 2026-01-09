package com.perundhu.domain.port;

/**
 * Service for managing AI prompts.
 * 
 * This service provides centralized management of prompts used for AI services
 * like Gemini Vision, allowing for:
 * - External storage of prompts (easier editing without recompilation)
 * - Versioning and A/B testing of prompts
 * - Caching for performance
 * - Prompt template substitution
 */
public interface PromptService {

  /**
   * Get the bus schedule extraction prompt for Gemini Vision API.
   * 
   * @return The complete prompt text
   */
  String getBusScheduleExtractionPrompt();

  /**
   * Get a prompt by name.
   * 
   * @param promptName The name of the prompt (e.g., "bus-schedule-extraction")
   * @return The prompt text, or null if not found
   */
  String getPrompt(String promptName);

  /**
   * Get a prompt with variable substitution.
   * 
   * @param promptName The name of the prompt
   * @param variables Map of variable name to value for substitution
   * @return The prompt text with variables substituted
   */
  String getPromptWithVariables(String promptName, java.util.Map<String, String> variables);

  /**
   * Reload all prompts from storage (useful for development).
   */
  void reloadPrompts();

  /**
   * Check if a prompt exists.
   * 
   * @param promptName The name of the prompt
   * @return true if the prompt exists
   */
  boolean hasPrompt(String promptName);
}
