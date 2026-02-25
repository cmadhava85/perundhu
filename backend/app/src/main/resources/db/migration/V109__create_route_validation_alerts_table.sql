-- Migration: V999_Create_Route_Validation_Alerts_Table
-- Author: System
-- Date: 2024-01-01
-- Description: Create table for storing route validation alerts from GraphHopper routing validation

CREATE TABLE route_validation_alerts (
    id CHAR(36) PRIMARY KEY COMMENT 'UUID primary key',
    contribution_id VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL COMMENT 'ID of the flagged route contribution',
    validation_type VARCHAR(50) NOT NULL COMMENT 'Type: JOURNEY_DURATION, STOP_SEQUENCE, SEGMENT_SPEED',
    confidence_score INT NOT NULL COMMENT 'Confidence score 0-100 that issue exists',
    expected_range VARCHAR(500) COMMENT 'Expected range for the metric',
    actual_value VARCHAR(500) COMMENT 'Actual measured or provided value',
    issue_description TEXT COMMENT 'Human-readable issue description',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING' COMMENT 'Status: PENDING, APPROVED, DISMISSED, REJECTED, ESCALATED',
    admin_notes TEXT COMMENT 'Admin notes on why alert was reviewed',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When alert was created',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Last update timestamp',
    reviewed_at TIMESTAMP NULL COMMENT 'When admin reviewed the alert',
    reviewed_by VARCHAR(255) COMMENT 'Email/ID of reviewing admin',
    
    -- Indexes for common queries
    INDEX idx_contribution_id (contribution_id),
    INDEX idx_status_created (status, created_at DESC),
    INDEX idx_validation_type (validation_type),
    INDEX idx_confidence_score (confidence_score),
    INDEX idx_reviewed_by (reviewed_by)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci 
  COMMENT='Stores route validation alerts flagged by GraphHopper routing validation engine';
