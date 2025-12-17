package com.perundhu.application.service;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Simple authentication service for handling user identification
 */
@Service
public class AuthenticationService {

    /**
     * Get the current user ID from Spring Security context
     * Returns the authenticated user's username or "anonymous" if not authenticated
     */
    public String getCurrentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.isAuthenticated()) {
            Object principal = authentication.getPrincipal();
            
            // Handle different principal types
            if (principal instanceof String) {
                String username = (String) principal;
                // Skip anonymous authentication
                if (!"anonymousUser".equals(username)) {
                    return username;
                }
            } else if (principal instanceof org.springframework.security.core.userdetails.UserDetails) {
                return ((org.springframework.security.core.userdetails.UserDetails) principal).getUsername();
            } else if (principal != null) {
                // Try to get a sensible string representation
                String principalStr = principal.toString();
                if (!"anonymousUser".equals(principalStr)) {
                    return principalStr;
                }
            }
        }
        
        return "anonymous";
    }

    /**
     * Check if the current user is authenticated
     */
    public boolean isAuthenticated() {
        return !getCurrentUserId().equals("anonymous");
    }

    /**
     * Check if the current user is an admin
     */
    public boolean isAdmin() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !authentication.isAuthenticated()) {
            return false;
        }
        
        // Check for admin role
        return authentication.getAuthorities().stream()
                .anyMatch(auth -> "ROLE_ADMIN".equals(auth.getAuthority()) 
                               || "admin".equals(auth.getAuthority()));
    }

    /**
     * Authenticate a user (placeholder)
     */
    public boolean authenticate(String username, String password) {
        // TODO: Implement proper authentication
        return false;
    }

    /**
     * Log out the current user
     */
    public void logout() {
        SecurityContextHolder.clearContext();
    }
}