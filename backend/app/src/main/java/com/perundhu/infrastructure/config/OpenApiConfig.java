package com.perundhu.infrastructure.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import io.swagger.v3.oas.models.tags.Tag;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

/**
 * OpenAPI/Swagger configuration for API documentation.
 * 
 * Access the API documentation at:
 * - Swagger UI: /swagger-ui.html
 * - OpenAPI JSON: /v3/api-docs
 * - OpenAPI YAML: /v3/api-docs.yaml
 */
@Configuration
public class OpenApiConfig {

  @Value("${spring.application.name:Perundhu Bus Transit API}")
  private String applicationName;

  @Bean
  public OpenAPI customOpenAPI() {
    final String securitySchemeName = "bearerAuth";

    return new OpenAPI()
        .info(new Info()
            .title("Perundhu Bus Transit API")
            .version("1.0.0")
            .description("""
                **Perundhu** is a comprehensive bus transit system API for Tamil Nadu, India.

                ## Features
                - 🚌 **Bus Search**: Find buses between locations with direct, via, and continuing routes
                - 📍 **Location Autocomplete**: Search locations with Tamil and English language support
                - 🗺️ **Stop Information**: Get intermediate stops for any bus route
                - 📸 **Image Contribution**: Upload bus schedule images for OCR processing
                - ✍️ **Route Contribution**: Contribute new routes manually or via voice/paste
                - 🔐 **Authentication**: Secure endpoints with JWT bearer tokens

                ## Language Support
                Pass `lang=ta` for Tamil translations or `lang=en` for English (default).

                ## Rate Limiting
                - Global: 100 requests/second
                - Per-user: 10 requests/second for search endpoints
                """)
            .contact(new Contact()
                .name("Perundhu Development Team")
                .email("support@perundhu.com")
                .url("https://github.com/cmadhava85/perundhu"))
            .license(new License()
                .name("MIT License")
                .url("https://opensource.org/licenses/MIT")))
        .servers(List.of(
            new Server()
                .url("http://localhost:8080")
                .description("Local Development Server"),
            new Server()
                .url("https://perundhu-backend-640693778134.us-central1.run.app")
                .description("Production Server")))
        .tags(List.of(
            new Tag().name("Bus Schedules").description("Bus search and schedule operations"),
            new Tag().name("Locations").description("Location search and autocomplete"),
            new Tag().name("Contributions").description("User-contributed routes and images"),
            new Tag().name("Admin").description("Administrative operations"),
            new Tag().name("Authentication").description("User authentication and authorization")))
        .addSecurityItem(new SecurityRequirement().addList(securitySchemeName))
        .components(new Components()
            .addSecuritySchemes(securitySchemeName, new SecurityScheme()
                .name(securitySchemeName)
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("Enter your JWT token obtained from the authentication endpoint")));
  }
}
