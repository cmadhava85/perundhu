package com.perundhu.domain.model;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

/**
 * Value object representing a language code
 */
public class LanguageCode {
    private final String code;
    
    // Set of supported language codes - including "en" (English) and "ta" (Tamil)
    private static final Set<String> SUPPORTED_LANGUAGES = new HashSet<>(Arrays.asList("en", "ta"));
    
    // Flag to disable validation for tests
    private static boolean TEST_MODE = false;
    
    public LanguageCode(String code) {
        if (code == null || code.trim().isEmpty()) {
            throw new IllegalArgumentException("Language code cannot be null or empty");
        }
        
        String normalizedCode = code.toLowerCase(Locale.ENGLISH);
        
        // Only validate if not in test mode and not a supported language
        if (!TEST_MODE && !SUPPORTED_LANGUAGES.contains(normalizedCode)) {
            throw new IllegalArgumentException("Unsupported language code: " + code);
        }
        
        this.code = normalizedCode;
    }
    
    /**
     * Enable test mode to bypass validation
     */
    public static void enableTestMode() {
        TEST_MODE = true;
    }
    
    /**
     * Disable test mode to restore validation
     */
    public static void disableTestMode() {
        TEST_MODE = false;
    }
    
    public String getCode() {
        return code;
    }
    
    @Override
    public String toString() {
        return code;
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        LanguageCode that = (LanguageCode) o;
        return Objects.equals(code, that.code);
    }
    
    @Override
    public int hashCode() {
        return Objects.hash(code);
    }
}