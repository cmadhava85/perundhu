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
import java.util.List;
import java.util.Locale;

/**
 * User-Agent Filter
 * 
 * Blocks requests from known scrapers and automated tools
 * Implements whitelist/blacklist pattern for user agents
 */
@Component
@Slf4j
public class UserAgentFilter extends OncePerRequestFilter {

    @Value("${security.ip-filtering.block-suspicious-agents:true}")
    private boolean blockSuspiciousAgents;

    private static final List<String> BLOCKED_AGENTS = Arrays.asList(
        // Common scrapers
        "scrapy", "selenium", "puppeteer", "beautifulsoup",
        // Bots
        "bot", "crawler", "spider", "scraper",
        // Data mining tools
        "wget", "curl", "libwww", "httplib", "python",
        "perl", "ruby", "php", "node", "java",
        // Specific scrapers
        "scraperbot", "webbot", "searchbot", "scrapbot",
        "screaming frog", "ahrefs", "semrush", "mj12bot",
        "ahrefsbot", "semrushbot", "domainrecon",
        // Other tools
        "nmap", "masscan", "zap", "burp"
    );

    private static final List<String> ALLOWED_AGENTS = Arrays.asList(
        "mozilla", "chrome", "safari", "firefox", "edge",
        "opera", "thunderbird", "lightning"
    );

    @Override
    protected void doFilterInternal(HttpServletRequest request, 
                                   HttpServletResponse response,
                                   FilterChain filterChain) throws ServletException, IOException {
        
        if (!blockSuspiciousAgents) {
            filterChain.doFilter(request, response);
            return;
        }

        String userAgent = request.getHeader("User-Agent");
        
        // Block requests with no user agent
        if (userAgent == null || userAgent.isEmpty()) {
            logSuspiciousActivity(request, "NO_USER_AGENT");
            sendError(response, HttpStatus.FORBIDDEN, "Invalid User-Agent");
            return;
        }

        String userAgentLower = userAgent.toLowerCase(Locale.ENGLISH);

        // Check if user agent is in blocked list
        if (isBlockedAgent(userAgentLower)) {
            logSuspiciousActivity(request, "BLOCKED_USER_AGENT: " + userAgent);
            sendError(response, HttpStatus.FORBIDDEN, "Access Denied");
            return;
        }

        // Check if user agent is allowed (strict mode optional)
        if (!isAllowedAgent(userAgentLower)) {
            log.warn("SUSPICIOUS_USER_AGENT | IP: {} | Agent: {} | URI: {}",
                    getClientIp(request), userAgent, request.getRequestURI());
            // Don't block, just warn - can be made strict via config
        }

        filterChain.doFilter(request, response);
    }

    private boolean isBlockedAgent(String userAgentLower) {
        return BLOCKED_AGENTS.stream()
            .anyMatch(userAgentLower::contains);
    }

    private boolean isAllowedAgent(String userAgentLower) {
        return ALLOWED_AGENTS.stream()
            .anyMatch(userAgentLower::contains);
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void logSuspiciousActivity(HttpServletRequest request, String reason) {
        String ip = getClientIp(request);
        String userAgent = request.getHeader("User-Agent");
        String method = request.getMethod();
        String uri = request.getRequestURI();

        log.warn("SUSPICIOUS_ACTIVITY | Reason: {} | IP: {} | Method: {} | URI: {} | UA: {}",
                reason, ip, method, uri, userAgent);
    }

    private void sendError(HttpServletResponse response, HttpStatus status, String message) throws IOException {
        response.setStatus(status.value());
        response.setContentType("application/json");
        response.getWriter().write("{\"error\": \"" + message + "\"}");
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // Don't filter health check endpoints
        String uri = request.getRequestURI();
        return uri.contains("/health") || uri.contains("/actuator") || uri.contains("/favicon");
    }
}
