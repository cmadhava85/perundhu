package com.perundhu.application.service;

import java.text.MessageFormat;
import java.util.HashMap;
import java.util.Map;

import org.springframework.stereotype.Service;

import com.perundhu.domain.port.MessageService;

/**
 * Application service implementation for handling localized messages
 */
@Service
public class MessageServiceImpl implements MessageService {
    private final Map<String, Map<String, String>> translationsByLang;

    public MessageServiceImpl() {
        translationsByLang = new HashMap<>();
        Map<String, String> defaultMessages = new HashMap<>();
        // Default messages
        defaultMessages.put("resource.not.found", "The requested resource was not found");
        defaultMessages.put("validation.failed", "Validation failed");
        defaultMessages.put("server.error", "An internal server error occurred");
        defaultMessages.put("api.validation.required", "The required parameters {0} are missing");
        defaultMessages.put("bus.stops.notFound", "No stops found for the bus");
        translationsByLang.put("en", defaultMessages);
    }

    /**
     * Get message by key and language code
     * @param key Message key
     * @param languageCode Language code
     * @return The message or the key itself if not found
     */
    @Override
    public String getMessage(String key, String languageCode) {
        Map<String, String> messages = translationsByLang.getOrDefault(languageCode, translationsByLang.get("en"));
        return messages.getOrDefault(key, key);
    }

    /**
     * Get message by key with default language
     * @param key Message key
     * @return The message or the key itself if not found
     */
    @Override
    public String getMessage(String key) {
        return getMessage(key, "en");
    }
    
    /**
     * Get message by key and format with parameters
     * @param key Message key
     * @param args Arguments for formatting
     * @return The formatted message or the key itself if not found
     */
    @Override
    public String getFormattedMessage(String key, Object[] args) {
        return getFormattedMessage(key, "en", args);
    }
    
    /**
     * Get message by key and language code and format with parameters
     * @param key Message key
     * @param languageCode Language code
     * @param args Arguments for formatting
     * @return The formatted message or the key itself if not found
     */
    @Override
    public String getFormattedMessage(String key, String languageCode, Object[] args) {
        String pattern = getMessage(key, languageCode);
        return MessageFormat.format(pattern, args);
    }

    /**
     * Set translations for a specific language
     * @param languageCode Language code
     * @param translations Map of message keys to translated messages
     */
    @Override
    public void setTranslations(String languageCode, Map<String, String> translations) {
        translationsByLang.put(languageCode, translations);
    }
}