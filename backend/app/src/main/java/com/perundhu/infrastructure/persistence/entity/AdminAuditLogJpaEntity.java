package com.perundhu.infrastructure.persistence.entity;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.perundhu.domain.model.AdminAuditLog;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * JPA Entity for admin audit logs
 * Stores comprehensive audit trail of all administrative actions
 */
@Entity
@Table(name = "admin_audit_logs", indexes = {
        @Index(name = "idx_admin_username", columnList = "admin_username"),
        @Index(name = "idx_action_type", columnList = "action_type"),
        @Index(name = "idx_timestamp", columnList = "timestamp"),
        @Index(name = "idx_resource", columnList = "resource_type, resource_id"),
        @Index(name = "idx_ip_address", columnList = "ip_address")
})
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAuditLogJpaEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(name = "admin_username", nullable = false, length = 100)
    private String adminUsername;

    @Column(name = "ip_address", length = 50)
    private String ipAddress;

    @Enumerated(EnumType.STRING)
    @Column(name = "action_type", nullable = false, length = 50)
    private AdminAuditLog.AdminActionType actionType;

    @Column(name = "resource_type", length = 100)
    private String resourceType;

    @Column(name = "resource_id", length = 100)
    private String resourceId;

    @Column(name = "action_description", length = 500)
    private String actionDescription;

    @Column(name = "state_before", columnDefinition = "TEXT")
    private String stateBefore;

    @Column(name = "state_after", columnDefinition = "TEXT")
    private String stateAfter;

    @Column(name = "http_method", length = 10)
    private String httpMethod;

    @Column(name = "request_uri", length = 500)
    private String requestUri;

    @Column(name = "request_params", columnDefinition = "TEXT")
    private String requestParams;

    @Column(name = "response_status")
    private Integer responseStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "result", nullable = false, length = 20)
    private AdminAuditLog.ActionResult result;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @CreationTimestamp
    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "session_id", length = 100)
    private String sessionId;

    @Column(name = "metadata", columnDefinition = "TEXT")
    private String metadata;

    /**
     * Convert to domain model
     */
    public AdminAuditLog toDomain() {
        return AdminAuditLog.builder()
                .id(this.id)
                .adminUsername(this.adminUsername)
                .ipAddress(this.ipAddress)
                .actionType(this.actionType)
                .resourceType(this.resourceType)
                .resourceId(this.resourceId)
                .actionDescription(this.actionDescription)
                .stateBefore(this.stateBefore)
                .stateAfter(this.stateAfter)
                .httpMethod(this.httpMethod)
                .requestUri(this.requestUri)
                .requestParams(this.requestParams)
                .responseStatus(this.responseStatus)
                .result(this.result)
                .errorMessage(this.errorMessage)
                .timestamp(this.timestamp)
                .durationMs(this.durationMs)
                .userAgent(this.userAgent)
                .sessionId(this.sessionId)
                .metadata(this.metadata)
                .build();
    }

    /**
     * Create from domain model
     */
    public static AdminAuditLogJpaEntity fromDomain(AdminAuditLog domain) {
        return AdminAuditLogJpaEntity.builder()
                .id(domain.getId())
                .adminUsername(domain.getAdminUsername())
                .ipAddress(domain.getIpAddress())
                .actionType(domain.getActionType())
                .resourceType(domain.getResourceType())
                .resourceId(domain.getResourceId())
                .actionDescription(domain.getActionDescription())
                .stateBefore(domain.getStateBefore())
                .stateAfter(domain.getStateAfter())
                .httpMethod(domain.getHttpMethod())
                .requestUri(domain.getRequestUri())
                .requestParams(domain.getRequestParams())
                .responseStatus(domain.getResponseStatus())
                .result(domain.getResult())
                .errorMessage(domain.getErrorMessage())
                .timestamp(domain.getTimestamp())
                .durationMs(domain.getDurationMs())
                .userAgent(domain.getUserAgent())
                .sessionId(domain.getSessionId())
                .metadata(domain.getMetadata())
                .build();
    }
}
