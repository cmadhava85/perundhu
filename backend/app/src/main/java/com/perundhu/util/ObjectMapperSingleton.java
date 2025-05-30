package com.perundhu.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;

/**
 * Singleton class for providing a pre-configured ObjectMapper instance
 */
public class ObjectMapperSingleton {
    private static final ObjectMapper INSTANCE = createObjectMapper();

    private ObjectMapperSingleton() {
        // Private constructor to prevent instantiation
    }

    public static ObjectMapper getInstance() {
        return INSTANCE;
    }

    private static ObjectMapper createObjectMapper() {
        ObjectMapper mapper = new ObjectMapper();
        mapper.registerModule(new JavaTimeModule());
        mapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
        return mapper;
    }
}