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
 * IP Filtering (Whitelist/Blacklist)
 * 
 * Implements IP-based access control
 * Supports both whitelist and blacklist modes
 */
@Component
@Slf4j
public class IpSecurityFilter extends OncePerRequestFilter {

    @Value("${security.ip-filtering.enabled:false}")
    private boolean ipFilteringEnabled;

    @Value("${security.ip-filtering.whitelist:}")
    private String whitelist;

    @Value("${security.ip-filtering.blacklist:}")
    private String blacklist;

    private Set<String> allowedIps = new HashSet<>();
    private Set<String> deniedIps = new HashSet<>();

    public IpSecurityFilter() {
        // Initialize empty sets
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {

        if (!ipFilteringEnabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = getClientIp(request);

        // Parse whitelist/blacklist if configured
        parseIpLists();

        // Check blacklist first
        if (!deniedIps.isEmpty() && deniedIps.contains(clientIp)) {
            log.warn("IP_BLACKLISTED | IP: {} | Method: {} | URI: {}",
                    clientIp, request.getMethod(), request.getRequestURI());
            sendError(response, HttpStatus.FORBIDDEN, "Access Denied");
            return;
        }

        // Check whitelist (if whitelist is not empty, only allow whitelisted IPs)
        if (!allowedIps.isEmpty() && !allowedIps.contains(clientIp)) {
            log.warn("IP_NOT_WHITELISTED | IP: {} | Method: {} | URI: {}",
                    clientIp, request.getMethod(), request.getRequestURI());
            sendError(response, HttpStatus.FORBIDDEN, "Access Denied");
            return;
        }

        filterChain.doFilter(request, response);
    }

    private void parseIpLists() {
        if (!whitelist.isEmpty() && allowedIps.isEmpty()) {
            allowedIps = new HashSet<>(Arrays.asList(whitelist.split(",")));
        }
        if (!blacklist.isEmpty() && deniedIps.isEmpty()) {
            deniedIps = new HashSet<>(Arrays.asList(blacklist.split(",")));
        }
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private void sendError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        String uri = request.getRequestURI();
        return uri.contains("/health") || uri.contains("/actuator");
    }
}
