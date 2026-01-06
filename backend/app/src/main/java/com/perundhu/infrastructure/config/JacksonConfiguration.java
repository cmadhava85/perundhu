package com.perundhu.infrastructure.config;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

/**
 * Jackson configuration for proper serialization/deserialization of Java types
 * Specifically handles:
 * - Java 8+ date/time types (LocalTime, LocalDateTime, LocalDate, etc.)
 * - Record types (Java 17+)
 * - Proper null handling and unknown properties
 */
@Configuration
public class JacksonConfiguration {

    /**
     * Configure ObjectMapper with proper settings for API responses
     * 
     * Handles:
     * 1. Java 8+ date/time types via JavaTimeModule
     * 2. ISO-8601 format for date/time (readable string format)
     * 3. Strict deserialization (fail on unknown properties)
     * 4. Record type support
     */
    @Bean
    public ObjectMapper objectMapper() {
        return Jackson2ObjectMapperBuilder.json()
                // Register Java 8+ date/time module (LocalTime, LocalDateTime, etc.)
                .modules(new JavaTimeModule())
                
                // Serialize date/time as ISO-8601 strings (not timestamps)
                // Example: "2026-01-06T14:30:00" instead of [2026, 1, 6, 14, 30, 0]
                .featuresToDisable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS)
                
                // Fail if JSON contains unknown fields during deserialization
                // Helps catch typos and API contract violations
                .featuresToEnable(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES)
                
                // Fail on null for primitive types
                .featuresToEnable(DeserializationFeature.FAIL_ON_NULL_FOR_PRIMITIVES)
                
                // Handle empty strings as null
                .featuresToEnable(DeserializationFeature.ACCEPT_EMPTY_STRING_AS_NULL_OBJECT)
                
                .build();
    }
}
