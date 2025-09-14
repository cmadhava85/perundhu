package com.perundhu.application.dto;

import java.util.Map;

/**
 * Data Transfer Object for Bus entities
 * Using Java 17 record for immutability and concise data container
 */
public record BusDTO(
                Long id,
                String number,
                String name,
                String operator,
                String type,
                Map<String, String> features) {
        // Records automatically provide constructor, getters, equals, hashCode, and
        // toString
}