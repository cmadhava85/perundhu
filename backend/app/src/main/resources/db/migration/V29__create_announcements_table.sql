-- V29: Create announcements table
-- This migration adds support for admin announcements displayed on the frontend

CREATE TABLE IF NOT EXISTS announcements (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    unique_id VARCHAR(100) NOT NULL UNIQUE,
    type VARCHAR(50) NOT NULL,
    title_key VARCHAR(255) NOT NULL,
    title_fallback VARCHAR(255) NOT NULL,
    message_key VARCHAR(255) NOT NULL,
    message_fallback TEXT NOT NULL,
    link VARCHAR(500),
    link_text_key VARCHAR(255),
    link_text_fallback VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_dismissible BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 5,
    announcement_category VARCHAR(50),
    target_users VARCHAR(50) NOT NULL DEFAULT 'ALL',
    display_banner BOOLEAN NOT NULL DEFAULT TRUE,
    display_modal BOOLEAN NOT NULL DEFAULT FALSE,
    starts_at TIMESTAMP,
    expires_at TIMESTAMP,
    view_count BIGINT NOT NULL DEFAULT 0,
    dismiss_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    
    -- Constraints for valid values
    CONSTRAINT chk_announcement_type CHECK (type IN ('INFO', 'WARNING', 'SUCCESS', 'NEW_FEATURE', 'MAINTENANCE')),
    CONSTRAINT chk_announcement_status CHECK (status IN ('DRAFT', 'PUBLISHED')),
    CONSTRAINT chk_target_audience CHECK (target_users IN ('ALL', 'ADMIN', 'CONTRIBUTORS', 'REGULAR_USERS'))
);

-- Indexes for common queries
CREATE INDEX idx_announcements_active ON announcements(is_active);
CREATE INDEX idx_announcements_expires ON announcements(expires_at);
CREATE INDEX idx_announcements_priority ON announcements(priority);
CREATE INDEX idx_announcements_unique_id ON announcements(unique_id);
CREATE INDEX idx_announcements_status ON announcements(status);
CREATE INDEX idx_announcements_created_at ON announcements(created_at);
CREATE INDEX idx_announcements_target_users ON announcements(target_users);

-- Composite indexes for common queries
CREATE INDEX idx_announcements_active_expires ON announcements(is_active, expires_at);
CREATE INDEX idx_announcements_active_priority ON announcements(is_active, priority DESC, created_at DESC);
