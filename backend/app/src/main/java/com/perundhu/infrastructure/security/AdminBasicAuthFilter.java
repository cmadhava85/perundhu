package com.perundhu.infrastructure.security;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

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

    @Value("${admin.auth.password:#{null}}")
    private String adminPassword;

    @Value("${admin.auth.enabled:true}")
    private boolean authEnabled;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String requestUri = request.getRequestURI();

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
            sendUnauthorizedResponse(response, "Admin authentication not configured");
            return;
        }

        // Get Authorization header
        String authHeader = request.getHeader("Authorization");

        if (authHeader == null) {
            log.debug("Missing Authorization header for admin endpoint: {}", requestUri);
            sendUnauthorizedResponse(response, "Authentication required");
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
                sendUnauthorizedResponse(response, "Invalid Bearer token");
                return;
            }
        }

        if (!authHeader.startsWith("Basic ")) {
            log.debug("Invalid Authorization header type for admin endpoint: {}", requestUri);
            sendUnauthorizedResponse(response, "Basic or Bearer authentication required");
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
                sendUnauthorizedResponse(response, "Invalid credentials format");
                return;
            }

            String username = credentials.substring(0, colonIndex);
            String password = credentials.substring(colonIndex + 1);

            // Validate credentials using constant-time comparison to prevent timing attacks
            if (isValidCredentials(username, password)) {
                log.info("Admin authentication successful for user: {} accessing: {}", username, requestUri);

                // Set authentication in security context
                List<SimpleGrantedAuthority> authorities = List.of(
                        new SimpleGrantedAuthority("ROLE_ADMIN"),
                        new SimpleGrantedAuthority("ROLE_USER"));
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(username,
                        null, authorities);
                SecurityContextHolder.getContext().setAuthentication(authentication);

                filterChain.doFilter(request, response);
            } else {
                log.warn("Invalid admin credentials for user: {} accessing: {}", username, requestUri);
                sendUnauthorizedResponse(response, "Invalid username or password");
            }
        } catch (IllegalArgumentException e) {
            log.warn("Failed to decode Basic auth credentials: {}", e.getMessage());
            sendUnauthorizedResponse(response, "Invalid credentials encoding");
        }
    }

    /**
     * Check if the request URI is an admin endpoint
     */
    private boolean isAdminEndpoint(String uri) {
        return uri.startsWith("/api/admin/")
                || uri.startsWith("/api/v1/admin/")
                || uri.contains("/admin/"); // Catch all admin sub-paths like /api/v1/route-issues/admin/
    }

    /**
     * Validate Bearer token for admin access (development mode)
     * Accepts dev-admin-token or any token containing "admin"
     */
    private boolean isValidBearerToken(String token) {
        if (token == null || token.isBlank()) {
            return false;
        }
        // Accept dev-admin-token or tokens containing "admin" (for development)
        return token.equals("dev-admin-token") || token.contains("admin");
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
    private void sendUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setHeader("WWW-Authenticate", "Basic realm=\"Perundhu Admin\"");
        response.setContentType("application/json");
        response.getWriter().write(String.format(
                "{\"error\":\"UNAUTHORIZED\",\"message\":\"%s\",\"status\":401}",
                message));
    }
}
