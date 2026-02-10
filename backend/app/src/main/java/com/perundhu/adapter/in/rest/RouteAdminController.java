package com.perundhu.adapter.in.rest;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.perundhu.application.port.in.AdminUseCase;
import com.perundhu.domain.model.RouteContribution;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * REST controller for route contribution admin operations.
 * Follows Single Responsibility Principle - handles only route admin operations.
 */
@RestController
@RequestMapping("/api/admin/contributions/routes")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class RouteAdminController {

    private final AdminUseCase adminUseCase;

    /**
     * Get all route contributions
     * 
     * @return List of all route contributions
     */
    @GetMapping
    public ResponseEntity<List<RouteContribution>> getAllRouteContributions() {
        log.info("Request to get all route contributions");
        return ResponseEntity.ok(adminUseCase.getAllRouteContributions());
    }

    /**
     * Get pending route contributions
     * 
     * @return List of pending route contributions
     */
    @GetMapping("/pending")
    public ResponseEntity<List<RouteContribution>> getPendingRouteContributions() {
        log.info("Request to get pending route contributions");
        return ResponseEntity.ok(adminUseCase.getPendingRouteContributions());
    }

    /**
     * Approve a route contribution
     * 
     * @param id The ID of the contribution to approve
     * @return The approved route contribution
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<RouteContribution> approveRouteContribution(@PathVariable String id) {
        log.info("Request to approve route contribution with id: {}", id);
        return ResponseEntity.ok(adminUseCase.approveRouteContribution(id));
    }

    /**
     * Reject a route contribution
     * 
     * @param id          The ID of the contribution to reject
     * @param requestBody The rejection reason
     * @return The rejected route contribution
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<RouteContribution> rejectRouteContribution(
            @PathVariable String id,
            @RequestBody Map<String, String> requestBody) {
        String reason = requestBody.get("reason");
        if (reason == null || reason.isBlank()) {
            reason = "No reason provided";
        }

        log.info("Request to reject route contribution with id: {}, reason: {}", id, reason);
        return ResponseEntity.ok(adminUseCase.rejectRouteContribution(id, reason));
    }

    /**
     * Delete a route contribution
     * 
     * @param id The ID of the contribution to delete
     * @return No content response
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRouteContribution(@PathVariable String id) {
        log.info("Request to delete route contribution with id: {}", id);
        adminUseCase.deleteRouteContribution(id);
        return ResponseEntity.noContent().build();
    }
}
