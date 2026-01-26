package com.perundhu.adapter.in.rest;

import java.time.LocalDateTime;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.service.AdminAuditService;
import com.perundhu.domain.model.AdminAuditLog;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for admin audit log management
 * Provides endpoints to query and analyze admin activity
 */
@RestController
@RequestMapping("/api/admin/audit-logs")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminAuditController {

    private final AdminAuditService auditService;

    /**
     * Get all audit logs with pagination
     */
    @GetMapping
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Request to get audit logs - page: {}, size: {}", page, size);
        return ResponseEntity.ok(auditService.getAuditLogs(page, size));
    }

    /**
     * Get audit logs by admin username
     */
    @GetMapping("/by-admin")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogsByAdmin(
            @RequestParam String username,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Request to get audit logs for admin: {}", username);
        return ResponseEntity.ok(auditService.getAuditLogsByAdmin(username, page, size));
    }

    /**
     * Get audit logs by action type
     */
    @GetMapping("/by-action-type")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogsByActionType(
            @RequestParam AdminAuditLog.AdminActionType actionType,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Request to get audit logs for action type: {}", actionType);
        return ResponseEntity.ok(auditService.getAuditLogsByActionType(actionType, page, size));
    }

    /**
     * Get audit logs for a specific resource
     */
    @GetMapping("/by-resource")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogsByResource(
            @RequestParam String resourceType,
            @RequestParam String resourceId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Request to get audit logs for resource: {} - {}", resourceType, resourceId);
        return ResponseEntity.ok(auditService.getAuditLogsByResource(resourceType, resourceId, page, size));
    }

    /**
     * Get audit logs within date range
     */
    @GetMapping("/by-date-range")
    public ResponseEntity<Page<AdminAuditLog>> getAuditLogsByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Request to get audit logs from {} to {}", start, end);
        return ResponseEntity.ok(auditService.getAuditLogsByDateRange(start, end, page, size));
    }

    /**
     * Get admin activity statistics
     */
    @GetMapping("/statistics")
    public ResponseEntity<Map<String, Object>> getStatistics(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        
        LocalDateTime sinceDate = since != null ? since : LocalDateTime.now().minusDays(30);
        log.info("Request to get admin activity statistics since: {}", sinceDate);
        return ResponseEntity.ok(auditService.getAdminActivityStatistics(sinceDate));
    }

    /**
     * Get current admin's recent actions
     */
    @GetMapping("/my-actions")
    public ResponseEntity<Page<AdminAuditLog>> getMyRecentActions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.info("Request to get my recent admin actions");
        return ResponseEntity.ok(auditService.getMyRecentActions(page, size));
    }
}
