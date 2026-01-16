package com.perundhu.infrastructure.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * API Key Authentication Filter
 * 
 * Validates API keys for public API endpoints
 * Allows authenticated users (JWT) to bypass API key check
 */
@Component
@Slf4j
public class ApiKeyAuthenticationFilter extends OncePerRequestFilter {

    @Value("${security.api-key.enabled:false}")
    private boolean apiKeyEnabled;

    @Value("${security.api-key.public-key:}")
    private String publicApiKey;

    @Value("${security.api-key.strict-mode:false}")
    private boolean strictMode;

    private static final String API_KEY_HEADER = "X-API-Key";

    // Endpoints that don't require API key
    private static final Set<String> EXCLUDED_ENDPOINTS = new HashSet<>(Arrays.asList(
        "/api/public",
        "/health",
        "/actuator",
        "/auth/login",
        "/auth/register",
        "/swagger-ui",
        "/api-docs",
        "/favicon"
    ));

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {

        if (!apiKeyEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String uri = request.getRequestURI();

        // Skip API key check for excluded endpoints
        if (isExcludedEndpoint(uri)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Check for JWT token first (authenticated users don't need API key)
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Require API key for public endpoints
        String apiKey = request.getHeader(API_KEY_HEADER);

        if (apiKey == null || apiKey.isEmpty()) {
            logApiKeyMissing(request);
            sendError(response, HttpStatus.UNAUTHORIZED, "Missing API Key");
            return;
        }

        if (!isValidApiKey(apiKey)) {
            logInvalidApiKey(request, apiKey);
            if (strictMode) {
                sendError(response, HttpStatus.FORBIDDEN, "Invalid API Key");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private boolean isValidApiKey(String apiKey) {
        return publicApiKey != null && publicApiKey.equals(apiKey);
    }

    private boolean isExcludedEndpoint(String uri) {
        return EXCLUDED_ENDPOINTS.stream()
            .anyMatch(uri::contains);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void logApiKeyMissing(HttpServletRequest request) {
        log.warn("API_KEY_MISSING | IP: {} | Method: {} | URI: {}",
                getClientIp(request), request.getMethod(), request.getRequestURI());
    }

    private void logInvalidApiKey(HttpServletRequest request, String apiKey) {
        log.warn("INVALID_API_KEY | IP: {} | Key: {} | Method: {} | URI: {}",
                getClientIp(request), maskApiKey(apiKey), request.getMethod(), request.getRequestURI());
    }

    private String maskApiKey(String apiKey) {
        if (apiKey.length() <= 4) return "***";
        return apiKey.substring(0, 2) + "****" + apiKey.substring(apiKey.length() - 2);
    }

    private void sendError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        return isExcludedEndpoint(request.getRequestURI());
    }
}
