-- V36: Create user_feedback table for contact form submissions
-- This table stores feedback, suggestions, and bug reports submitted through the Contact Us form

CREATE TABLE user_feedback (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    category VARCHAR(50) NOT NULL COMMENT 'Feedback category: suggestion, bug, feature, general',
    message LONGTEXT NOT NULL COMMENT 'Feedback message from user',
    email VARCHAR(255) NOT NULL COMMENT 'User email address for follow-up',
    screenshot_filename VARCHAR(255) COMMENT 'Original filename of uploaded screenshot',
    screenshot_url VARCHAR(500) COMMENT 'URL to access the uploaded screenshot',
    user_agent TEXT COMMENT 'Browser user agent information',
    page_url TEXT COMMENT 'URL of the page where feedback was submitted',
    ip_address VARCHAR(45) COMMENT 'IPv4 or IPv6 address of the user',
    status VARCHAR(50) NOT NULL DEFAULT 'NEW' COMMENT 'Status: NEW, ACKNOWLEDGED, UNDER_REVIEW, RESOLVED, ARCHIVED',
    admin_notes LONGTEXT COMMENT 'Internal notes from administrators',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    reviewed_at TIMESTAMP NULL COMMENT 'When the feedback was reviewed',
    reviewed_by VARCHAR(100) COMMENT 'Username of admin who reviewed the feedback',
    
    -- Indexes for common queries
    INDEX idx_email (email),
    INDEX idx_category (category),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_category_status (category, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Stores user feedback and feature requests from the Contact Us form';
