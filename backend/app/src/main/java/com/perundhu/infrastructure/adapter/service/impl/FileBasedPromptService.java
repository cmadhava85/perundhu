package com.perundhu.infrastructure.adapter.service.impl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.core.io.support.ResourcePatternResolver;
import org.springframework.stereotype.Service;

import com.perundhu.domain.port.PromptService;

import jakarta.annotation.PostConstruct;

/**
 * File-based implementation of PromptService.
 * 
 * Loads prompts from classpath resources in the prompts/ directory.
 * Prompts are cached in memory and can be reloaded for development.
 */
@Service
public class FileBasedPromptService implements PromptService {

  private static final Logger log = LoggerFactory.getLogger(FileBasedPromptService.class);
  
  private static final String PROMPTS_BASE_PATH = "classpath:prompts/";
  private static final String BUS_SCHEDULE_PROMPT_NAME = "bus-schedule-extraction";
  
  private final Map<String, String> promptCache = new ConcurrentHashMap<>();
  private final ResourcePatternResolver resourceResolver = new PathMatchingResourcePatternResolver();

  @PostConstruct
  public void init() {
    loadAllPrompts();
  }

  @Override
  public String getBusScheduleExtractionPrompt() {
    return getPrompt(BUS_SCHEDULE_PROMPT_NAME);
  }

  @Override
  public String getPrompt(String promptName) {
    String prompt = promptCache.get(promptName);
    if (prompt == null) {
      log.warn("Prompt '{}' not found in cache, attempting to load", promptName);
      prompt = loadPrompt(promptName);
      if (prompt != null) {
        promptCache.put(promptName, prompt);
      }
    }
    return prompt;
  }

  @Override
  public String getPromptWithVariables(String promptName, Map<String, String> variables) {
    String template = getPrompt(promptName);
    if (template == null) {
      return null;
    }
    
    String result = template;
    for (Map.Entry<String, String> entry : variables.entrySet()) {
      String placeholder = "${" + entry.getKey() + "}";
      result = result.replace(placeholder, entry.getValue());
    }
    return result;
  }

  @Override
  public void reloadPrompts() {
    log.info("Reloading all prompts from storage");
    promptCache.clear();
    loadAllPrompts();
  }

  @Override
  public boolean hasPrompt(String promptName) {
    return promptCache.containsKey(promptName);
  }

  private void loadAllPrompts() {
    try {
      Resource[] resources = resourceResolver.getResources(PROMPTS_BASE_PATH + "*.txt");
      log.info("Found {} prompt files to load", resources.length);
      
      for (Resource resource : resources) {
        String filename = resource.getFilename();
        if (filename != null) {
          String promptName = filename.replace(".txt", "");
          String content = loadResourceContent(resource);
          if (content != null) {
            promptCache.put(promptName, content);
            log.info("Loaded prompt: {} ({} characters)", promptName, content.length());
          }
        }
      }
      
      if (promptCache.isEmpty()) {
        log.warn("No prompts were loaded! Check prompts directory: {}", PROMPTS_BASE_PATH);
      }
    } catch (IOException e) {
      log.error("Error loading prompts from directory: {}", e.getMessage(), e);
    }
  }

  private String loadPrompt(String promptName) {
    try {
      Resource resource = resourceResolver.getResource(PROMPTS_BASE_PATH + promptName + ".txt");
      if (resource.exists()) {
        return loadResourceContent(resource);
      } else {
        log.warn("Prompt file not found: {}", promptName);
        return null;
      }
    } catch (IOException e) {
      log.error("Error loading prompt '{}': {}", promptName, e.getMessage(), e);
      return null;
    }
  }

  private String loadResourceContent(Resource resource) throws IOException {
    try (var inputStream = resource.getInputStream()) {
      return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
    }
  }
}
