package com.perundhu.config;

import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.servlet.error.BasicErrorController;
import org.springframework.boot.web.servlet.error.ErrorAttributes;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration to ensure all responses, including error responses,
 * are consistently returned in JSON format.
 */
@Configuration
public class ErrorConfiguration implements WebMvcConfigurer {

    /**
     * Configure content negotiation to favor JSON
     */
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.defaultContentType(MediaType.APPLICATION_JSON);
    }

    /**
     * Custom error controller that ensures all error responses are in JSON format
     */
    @Bean
    public BasicErrorController basicErrorController(ErrorAttributes errorAttributes, ServerProperties serverProperties) {
        return new JsonErrorController(errorAttributes, serverProperties.getError());
    }
}