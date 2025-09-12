package com.perundhu.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.boot.autoconfigure.web.ServerProperties;
import org.springframework.boot.autoconfigure.web.servlet.error.BasicErrorController;
import org.springframework.boot.web.servlet.error.DefaultErrorAttributes;
import org.springframework.boot.web.servlet.error.ErrorAttributes;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.http.MediaType;
import org.springframework.web.servlet.config.annotation.ContentNegotiationConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuration to ensure all responses, including error responses,
 * are consistently returned in JSON format.
 * Only active in non-test environments to avoid Spring Boot test context
 * issues.
 */
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@Profile("!test")
public class ErrorConfiguration implements WebMvcConfigurer {

    /**
     * Configure content negotiation to favor JSON
     */
    @Override
    public void configureContentNegotiation(ContentNegotiationConfigurer configurer) {
        configurer.defaultContentType(MediaType.APPLICATION_JSON);
    }

    /**
     * Provide ErrorAttributes bean if not already present
     */
    @Bean
    @ConditionalOnMissingBean(ErrorAttributes.class)
    public ErrorAttributes errorAttributes() {
        return new DefaultErrorAttributes();
    }

    /**
     * Custom error controller that ensures all error responses are in JSON format
     */
    @Bean
    @ConditionalOnMissingBean(BasicErrorController.class)
    @ConditionalOnProperty(name = "server.port") // Only if server is configured
    public BasicErrorController basicErrorController(ErrorAttributes errorAttributes,
            ServerProperties serverProperties) {
        return new JsonErrorController(errorAttributes, serverProperties.getError());
    }
}