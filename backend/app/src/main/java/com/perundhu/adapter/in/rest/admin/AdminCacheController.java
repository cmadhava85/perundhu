package com.perundhu.adapter.in.rest.admin;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;

/**
 * Admin Cache Management Controller
 * Provides endpoints for cache administration without requiring server restart.
 * 
 * Features:
 * - Clear all caches or specific cache by name
 * - View cache statistics and names
 * - Useful for testing and troubleshooting production issues
 * 
 * All endpoints require ADMIN role.
 */
@RestController
@RequestMapping("/admin/cache")
@Tag(name = "Admin - Cache Management", description = "Manage application caches")
@SecurityRequirement(name = "bearer")
public class AdminCacheController {

    private static final Logger log = LoggerFactory.getLogger(AdminCacheController.class);
    private static final String SUCCESS_KEY = "success";
    private static final String TIMESTAMP_KEY = "timestamp";
    private static final String MESSAGE_KEY = "message";
    
    private final CacheManager cacheManager;

    public AdminCacheController(CacheManager cacheManager) {
        this.cacheManager = cacheManager;
    }

    /**
     * Get list of all available caches with basic statistics
     */
    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "List all caches", 
            description = "Returns list of all cache names configured in the application")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cache list retrieved successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<Map<String, Object>> listCaches() {
        log.info("Admin requesting cache list");
        
        Collection<String> cacheNames = cacheManager.getCacheNames();
        
        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, true);
        response.put("cacheCount", cacheNames.size());
        response.put("caches", new ArrayList<>(cacheNames));
        response.put(TIMESTAMP_KEY, System.currentTimeMillis());
        
        log.info("Found {} caches: {}", cacheNames.size(), cacheNames);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Clear ALL application caches
     * Use this to force fresh data load from database (e.g., after data updates)
     */
    @PostMapping("/clear-all")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Clear all caches", 
            description = "Evicts all entries from all application caches. Useful after data imports or fixes.")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "All caches cleared successfully"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<Map<String, Object>> clearAllCaches() {
        log.warn("⚠️  Admin triggering FULL CACHE CLEAR");
        
        long startTime = System.currentTimeMillis();
        Collection<String> cacheNames = cacheManager.getCacheNames();
        int clearedCount = 0;
        List<String> clearedCaches = new ArrayList<>();
        
        for (String cacheName : cacheNames) {
            try {
                Cache cache = cacheManager.getCache(cacheName);
                if (cache != null) {
                    cache.clear();
                    clearedCount++;
                    clearedCaches.add(cacheName);
                    log.info("  ✓ Cleared cache: {}", cacheName);
                }
            } catch (Exception e) {
                log.error("Failed to clear cache '{}': {}", cacheName, e.getMessage());
            }
        }
        
        long duration = System.currentTimeMillis() - startTime;
        
        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, true);
        response.put(MESSAGE_KEY, "All caches cleared successfully");
        response.put("clearedCount", clearedCount);
        response.put("clearedCaches", clearedCaches);
        response.put("durationMs", duration);
        response.put(TIMESTAMP_KEY, System.currentTimeMillis());
        
        log.info("✅ Cleared {} caches in {} ms", clearedCount, duration);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Clear a specific cache by name
     * More targeted than clearing all caches
     */
    @PostMapping("/clear/{cacheName}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Clear specific cache", 
            description = "Evicts all entries from a specific cache by name")
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Cache cleared successfully"),
            @ApiResponse(responseCode = "404", description = "Cache not found"),
            @ApiResponse(responseCode = "403", description = "Insufficient permissions")
    })
    public ResponseEntity<Map<String, Object>> clearCache(@PathVariable String cacheName) {
        log.info("Admin clearing cache: {}", cacheName);
        
        Cache cache = cacheManager.getCache(cacheName);
        
        if (cache == null) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put(SUCCESS_KEY, false);
            errorResponse.put("error", "Cache not found");
            errorResponse.put(MESSAGE_KEY, String.format("Cache '%s' does not exist", cacheName));
            errorResponse.put("availableCaches", new ArrayList<>(cacheManager.getCacheNames()));
            errorResponse.put(TIMESTAMP_KEY, System.currentTimeMillis());
            
            log.warn("Cache '{}' not found", cacheName);
            return ResponseEntity.status(404).body(errorResponse);
        }
        
        long startTime = System.currentTimeMillis();
        cache.clear();
        long duration = System.currentTimeMillis() - startTime;
        
        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, true);
        response.put(MESSAGE_KEY, String.format("Cache '%s' cleared successfully", cacheName));
        response.put("cacheName", cacheName);
        response.put("durationMs", duration);
        response.put(TIMESTAMP_KEY, System.currentTimeMillis());
        
        log.info("✅ Cleared cache '{}' in {} ms", cacheName, duration);
        
        return ResponseEntity.ok(response);
    }

    /**
     * Health check endpoint for cache subsystem
     */
    @GetMapping("/health")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cache health check", 
            description = "Verifies cache manager is operational")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        Map<String, Object> response = new HashMap<>();
        response.put(SUCCESS_KEY, true);
        response.put("cacheManagerClass", cacheManager.getClass().getSimpleName());
        response.put("cacheCount", cacheManager.getCacheNames().size());
        response.put(TIMESTAMP_KEY, System.currentTimeMillis());
        
        return ResponseEntity.ok(response);
    }
}
