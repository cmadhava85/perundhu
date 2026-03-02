package com.perundhu.infrastructure.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.RequestAttributeSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.annotation.PostConstruct;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;

/**
 * HTTP Basic Authentication filter for admin endpoints.
 * Username and password are read from configuration (GCP Secret Manager in
 * production).
 * 
 * This filter intercepts requests to /api/admin/** and /api/v1/admin/**
 * endpoints
 * and validates Basic Auth credentials.
 */
@Component
@Slf4j
@Order(1) // High priority to run early in the filter chain
public class AdminBasicAuthFilter extends OncePerRequestFilter {

    @Value("${admin.auth.username:admin}")
    private String adminUsername;

    @Value("${admin.auth.password:admin}")
    private String adminPassword;

    @Value("${admin.auth.enabled:true}")
    private boolean authEnabled;

    @Value("${spring.profiles.active:default}")
    private String activeProfile;

    // Use shared SecurityContextRepository - injected to match SecurityConfig
    private final SecurityContextRepository securityContextRepository;

    public AdminBasicAuthFilter(@Lazy SecurityContextRepository securityContextRepository) {
        this.securityContextRepository = securityContextRepository;
    }

    /**
     * Validate admin credentials on startup to catch configuration issues early.
     */
    @PostConstruct
    public void validateCredentialsOnStartup() {
        log.info("=============================================================");
        log.info("ADMIN AUTHENTICATION CONFIGURATION VALIDATION");
        log.info("=============================================================");
        log.info("Active Profile: {}", activeProfile);
        log.info("Admin Auth Enabled: {}", authEnabled);
        log.info("Admin Username: {}", adminUsername != null ? maskValue(adminUsername) : "NOT SET");
        log.info("Admin Password: {}", adminPassword != null ? maskValue(adminPassword) : "NOT SET");

        if (!authEnabled) {
            log.warn("⚠️  ADMIN AUTHENTICATION IS DISABLED - All admin endpoints are unprotected!");
            log.info("=============================================================");
            return;
        }

        // Validate credentials are properly configured
        boolean hasIssues = false;

        if (adminUsername == null || adminUsername.isBlank()) {
            log.error("❌ ADMIN USERNAME IS NOT SET - Admin authentication will fail!");
            hasIssues = true;
        } else if (adminUsername.contains(":latest")) {
            log.error("❌ ADMIN USERNAME CONTAINS ':latest' - Secret not loaded from GCP Secret Manager!");
            log.error("   Current value: {}", maskValue(adminUsername));
            log.error("   Expected: Actual username value from secret");
            log.error("   Fix: Move ADMIN_USERNAME from --set-env-vars to --update-secrets in CD pipeline");
            hasIssues = true;
        } else if (adminUsername.length() < 3) {
            log.warn("⚠️  ADMIN USERNAME IS TOO SHORT (length: {}) - Recommended minimum: 3 characters",
                    adminUsername.length());
        }

        if (adminPassword == null || adminPassword.isBlank()) {
            log.error("❌ ADMIN PASSWORD IS NOT SET - Admin authentication will fail!");
            hasIssues = true;
        } else if (adminPassword.contains(":latest")) {
            log.error("❌ ADMIN PASSWORD CONTAINS ':latest' - Secret not loaded from GCP Secret Manager!");
            log.error("   Current value: {}", maskValue(adminPassword));
            log.error("   Expected: Actual password value from secret");
            log.error("   Fix: Move ADMIN_PASSWORD from --set-env-vars to --update-secrets in CD pipeline");
            hasIssues = true;
        } else if (adminPassword.length() < 8) {
            log.warn("⚠️  ADMIN PASSWORD IS WEAK (length: {}) - Recommended minimum: 8 characters",
                    adminPassword.length());
        }

        if (hasIssues) {
            log.error("=============================================================");
            log.error("❌ CRITICAL: ADMIN CREDENTIALS NOT PROPERLY CONFIGURED");
            log.error("=============================================================");
            if (activeProfile.contains("prod") || activeProfile.contains("preprod")) {
                throw new IllegalStateException(
                        "Admin credentials are not properly configured for " + activeProfile + " environment. " +
                                "Check the CD pipeline configuration and ensure secrets are loaded from GCP Secret Manager.");
            }
        } else {
            log.info("✅ Admin credentials validated successfully");
        }

        log.info("=============================================================");
    }

    /**
     * Mask sensitive values for logging - show first/last 2 chars only
     */
    private String maskValue(String value) {
        if (value == null || value.length() <= 4) {
            return "***";
        }
        return value.substring(0, 2) + "***" + value.substring(value.length() - 2);
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();
        String method = request.getMethod();

        // Allow CORS preflight requests (OPTIONS) without authentication
        // CORS preflight must succeed with appropriate headers for browsers to proceed
        if ("OPTIONS".equalsIgnoreCase(method)) {
            log.debug("Allowing CORS preflight request (OPTIONS) without authentication: {}", requestUri);
            filterChain.doFilter(request, response);
            return;
        }

        // Only apply to admin endpoints
        if (!isAdminEndpoint(requestUri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Skip authentication if disabled (for development)
        if (!authEnabled) {
            log.debug("Admin authentication disabled, allowing request to: {}", requestUri);
            filterChain.doFilter(request, response);
            return;
        }

        // Check if password is configured
        if (adminPassword == null || adminPassword.isBlank()) {
            log.warn("Admin password not configured! Denying access to: {}", requestUri);
            sendUnauthorizedResponse(request, response, "Admin authentication not configured");
            return;
        }

        // Get Authorization header
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null) {
            log.debug("Missing Authorization header for admin endpoint: {}", requestUri);
            sendUnauthorizedResponse(request, response, "Authentication required");
            return;
        }

        // Support both Basic and Bearer authentication for admin endpoints
        if (authHeader.startsWith("Bearer ")) {
            // Handle Bearer token authentication (for dev/JWT tokens)
            String token = authHeader.substring("Bearer ".length()).trim();
            if (isValidBearerToken(token)) {
                log.info("Admin authentication successful via Bearer token for: {}", requestUri);
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_USER"));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        "admin-bearer", null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);
                filterChain.doFilter(request, response);
                return;
            } else {
                log.warn("Invalid Bearer token for admin endpoint: {}", requestUri);
                sendUnauthorizedResponse(request, response, "Invalid Bearer token");
                return;
            }
        }

        if (!authHeader.startsWith("Basic ")) {
            log.debug("Invalid Authorization header type for admin endpoint: {}", requestUri);
            sendUnauthorizedResponse(request, response, "Basic or Bearer authentication required");
            return;
        }

        // Decode and validate credentials
        try {
            String base64Credentials = authHeader.substring("Basic ".length()).trim();
            String credentials = new String(Base64.getDecoder().decode(base64Credentials), StandardCharsets.UTF_8);

            // Credentials are in format username:password
            int colonIndex = credentials.indexOf(':');
            if (colonIndex == -1) {
                log.warn("Invalid credentials format for admin request: {}", requestUri);
                sendUnauthorizedResponse(request, response, "Invalid credentials format");
                return;
            }

            String username = credentials.substring(0, colonIndex);
            String password = credentials.substring(colonIndex + 1);

            // Validate credentials using constant-time comparison to prevent timing attacks
            if (isValidCredentials(username, password)) {
                log.info("Admin authentication successful for user: {} accessing: {}", username, requestUri);

                // Create authentication token with ADMIN role
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_USER"));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username,
                        null, authorities);

                // Create new SecurityContext and set authentication
                SecurityContext context = SecurityContextHolder.createEmptyContext();
                context.setAuthentication(authentication);
                SecurityContextHolder.setContext(context);

                // CRITICAL: Save context to repository so Spring Security filters can access it
                securityContextRepository.saveContext(context, request, response);

                log.debug("SecurityContext saved for user: {} with authorities: {}", username, authorities);

                filterChain.doFilter(request, response);
            } else {
                log.warn("Invalid admin credentials for user: {} accessing: {}", username, requestUri);
                sendUnauthorizedResponse(request, response, "Invalid username or password");
            }
        } catch (IllegalArgumentException e) {
            log.warn("Failed to decode Basic auth credentials: {}", e.getMessage());
            sendUnauthorizedResponse(request, response, "Invalid credentials encoding");
        }
    }

    /**
     * Check if the request URI is an admin endpoint
     */
    private boolean isAdminEndpoint(String uri) {
        // Exclude auth endpoints - they handle their own authentication
        if (uri.startsWith("/api/admin/auth/") || uri.startsWith("/admin/auth/")) {
            return false;
        }

        return uri.startsWith("/api/admin/")
                || uri.startsWith("/api/v1/admin/")
                || uri.contains("/admin/"); // Catch all admin sub-paths like /api/v1/route-issues/admin/
    }

    /**
     * Validate Bearer token for admin access (development mode ONLY)
     * SECURITY: Only accepts hardcoded dev token in non-production environments
     * In production, this should return false or integrate with proper JWT
     * validation
     */
    private boolean isValidBearerToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }

        // CRITICAL SECURITY: Only allow bearer token auth in development/test
        // environments
        boolean isDevelopment = activeProfile != null &&
                (activeProfile.contains("dev") || activeProfile.contains("test") || activeProfile.contains("local"));

        if (!isDevelopment) {
            log.warn("Bearer token authentication attempted in non-development environment: {}", activeProfile);
            return false;
        }

        // Only accept the exact dev token - NO wildcards or partial matches
        boolean isValid = token.equals("dev-admin-token");

        if (!isValid) {
            log.debug("Invalid bearer token attempted in development mode");
        }

        return isValid;
    }

    /**
     * Validate credentials using constant-time comparison
     */
    private boolean isValidCredentials(String username, String password) {
        // Use constant-time comparison to prevent timing attacks
        boolean usernameValid = constantTimeEquals(username, adminUsername);
        boolean passwordValid = constantTimeEquals(password, adminPassword);
        return usernameValid && passwordValid;
    }

    /**
     * Constant-time string comparison to prevent timing attacks
     */
    private boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null) {
            return false;
        }

        byte[] aBytes = a.getBytes(StandardCharsets.UTF_8);
        byte[] bBytes = b.getBytes(StandardCharsets.UTF_8);

        // XOR all bytes together to ensure constant-time comparison
        int result = aBytes.length ^ bBytes.length;
        for (int i = 0; i < Math.min(aBytes.length, bBytes.length); i++) {
            result |= aBytes[i] ^ bBytes[i];
        }

        return result == 0;
    }

    /**
     * Send 401 Unauthorized response with WWW-Authenticate header
     */
    private void sendUnauthorizedResponse(HttpServletRequest request, HttpServletResponse response, String message)
            throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        // Avoid triggering browser Basic Auth popup for XHR/Fetch/API calls
        String requestedWith = request.getHeader("X-Requested-With");
        String accept = request.getHeader("Accept");
        boolean isAjax = requestedWith != null && requestedWith.equalsIgnoreCase("XMLHttpRequest");
        boolean expectsJson = accept != null && accept.toLowerCase().contains("application/json");

        if (!(isAjax || expectsJson)) {
            // For non-AJAX navigations (e.g., direct browser access), include header
            response.setHeader("WWW-Authenticate", "Basic realm=\"Perundhu Admin\"");
        }

        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\"error\":\"UNAUTHORIZED\",\"message\":\"%s\",\"status\":401}",
                message));
    }
}
