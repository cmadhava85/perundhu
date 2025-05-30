package com.perundhu.domain.port;

import java.util.Map;

/**
 * Domain port for handling localized messages
 */
public interface MessageService {
    /**
     * Get message by key and language code
     * @param key Message key
     * @param languageCode Language code
     * @return The message or the key itself if not found
     */
    String getMessage(String key, String languageCode);
    
    /**
     * Get message by key with default language
     * @param key Message key
     * @return The message or the key itself if not found
     */
    String getMessage(String key);
    
    /**
     * Get message by key and format with parameters
     * @param key Message key
     * @param args Arguments for formatting
     * @return The formatted message or the key itself if not found
     */
    String getFormattedMessage(String key, Object[] args);
    
    /**
     * Get message by key and language code and format with parameters
     * @param key Message key
     * @param languageCode Language code
     * @param args Arguments for formatting
     * @return The formatted message or the key itself if not found
     */
    String getFormattedMessage(String key, String languageCode, Object[] args);
    
    /**
     * Set translations for a specific language
     * @param languageCode Language code
     * @param translations Map of message keys to translated messages
     */
    void setTranslations(String languageCode, Map<String, String> translations);
}