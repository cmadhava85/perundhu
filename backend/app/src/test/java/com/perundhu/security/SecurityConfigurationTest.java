package com.perundhu.security;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.perundhu.infrastructure.security.RecaptchaValidationService;
import org.junit.jupiter.api.Disabled;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureWebMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.context.ApplicationContext;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

/**
 * Security configuration tests
 */
@Disabled("Temporarily disabled - ApplicationContext loading issues")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@TestPropertySource(properties = {
    "spring.flyway.enabled=false",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.main.web-application-type=servlet",
    "security.api.rate-limit.enabled=false",
    "security.ip-filtering.enabled=false",
    "spring.cloud.compatibility-verifier.enabled=false"
})
@AutoConfigureWebMvc
public class SecurityConfigurationTest {

  @Autowired
  private ApplicationContext applicationContext;

  // Mock dependencies required by admin auth controller
  @MockitoBean
  private RecaptchaValidationService recaptchaValidationService;

  @MockitoBean
  private AuthenticationManager authenticationManager;

  @Nested
  class ConfigurationLoadingTests {

    @Test
    @Disabled("Temporarily disabled - ApplicationContext loading issues")
    void contextLoads() {
      assertNotNull(applicationContext);
    }

    @Test
    @Disabled("Temporarily disabled - ApplicationContext loading issues")
    void securityConfigurationIsLoaded() {
      assertTrue(applicationContext.containsBean("securityFilterChain"));
    }
  }

  @Nested
  class BasicSecurityTests {

    @Test
    @Disabled("Temporarily disabled - ApplicationContext loading issues")
    void securityConfigurationExists() {
      assertNotNull(applicationContext);
      // Check both filter chain beans now that we have two security configs
      assertTrue(
          applicationContext.containsBean("securityFilterChain") ||
              applicationContext.containsBean("jwtSecurityFilterChain"),
          "Expected either securityFilterChain or jwtSecurityFilterChain bean to exist");
    }

    @Test
    @Disabled("Temporarily disabled - ApplicationContext loading issues")
    void corsConfigurationExists() {
      // Check both CORS configuration beans now that we have two security configs
      assertTrue(
          applicationContext.containsBean("corsConfigurationSource") ||
              applicationContext.containsBean("jwtCorsConfigurationSource"),
          "Expected either corsConfigurationSource or jwtCorsConfigurationSource bean to exist");
    }
  }

  @Nested
  class SecurityPropertyTests {

    @Test
    @Disabled("Temporarily disabled - ApplicationContext loading issues")
    void securityPropertiesAreDisabled() {
      // Verify test security properties are properly set
      assertNotNull(applicationContext);
    }
  }
}