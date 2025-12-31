-- V7__create_system_settings_table.sql
-- Table for storing system settings including feature flags

CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(255) NOT NULL,
    setting_value TEXT NOT NULL,
    category VARCHAR(100) NOT NULL DEFAULT 'general',
    description VARCHAR(500) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL,
    
    CONSTRAINT uk_system_settings_key UNIQUE (setting_key),
    INDEX idx_system_settings_category (category),
    INDEX idx_system_settings_key (setting_key)
);

-- Add comments for documentation
ALTER TABLE system_settings COMMENT = 'Stores system configuration settings and feature flags';

-- Insert default feature flag settings
INSERT INTO system_settings (setting_key, setting_value, category, description) VALUES
-- Contribution method toggles
('feature.contribution.manual.enabled', 'true', 'features', 'Enable manual route contribution'),
('feature.contribution.image.enabled', 'true', 'features', 'Enable image-based route contribution'),
('feature.contribution.paste.enabled', 'true', 'features', 'Enable paste text contribution'),
('feature.contribution.voice.enabled', 'false', 'features', 'Enable voice input contribution'),

-- UI action toggles
('feature.share.enabled', 'true', 'features', 'Enable share route functionality'),
('feature.addStops.enabled', 'true', 'features', 'Enable add stops functionality'),
('feature.reportIssue.enabled', 'true', 'features', 'Enable report issue functionality'),

-- Other feature toggles
('feature.socialMedia.enabled', 'false', 'features', 'Enable social media monitoring'),
('feature.communityRewards.enabled', 'false', 'features', 'Enable community rewards program'),
('feature.businessPartners.enabled', 'false', 'features', 'Enable business partner integrations'),
('feature.osmIntegration.enabled', 'false', 'features', 'Enable OpenStreetMap integration'),
('feature.realTimeUpdates.enabled', 'false', 'features', 'Enable real-time updates'),

-- Security settings
('security.rateLimiting.enabled', 'true', 'security', 'Enable API rate limiting'),
('security.maxRequestsPerMinute', '60', 'security', 'Maximum API requests per minute'),
('security.autoApproval.enabled', 'false', 'security', 'Enable auto-approval for contributions'),
('security.requireEmailVerification', 'false', 'security', 'Require email verification for contributions'),

-- System settings
('system.geminiAi.enabled', 'true', 'system', 'Enable Gemini AI for OCR processing'),
('system.cacheEnabled', 'true', 'system', 'Enable response caching'),
('system.maintenanceMode', 'false', 'system', 'Enable maintenance mode');
