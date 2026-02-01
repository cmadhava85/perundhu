-- V105: Add Google AdSense advertising system settings
-- Adds support for Phase 1 of the advertisement strategy

-- Check if system_settings table exists, if not create it
CREATE TABLE IF NOT EXISTS system_settings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) NOT NULL UNIQUE COLLATE utf8mb4_unicode_ci,
    setting_value VARCHAR(1000) COLLATE utf8mb4_unicode_ci,
    category VARCHAR(50) COLLATE utf8mb4_unicode_ci,
    description VARCHAR(255) COLLATE utf8mb4_unicode_ci,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add Google AdSense settings for advertisement strategy
INSERT IGNORE INTO system_settings (setting_key, setting_value, category, description) VALUES
    ('feature.ads.enabled', 'false', 'features', 'Enable Google AdSense advertisements'),
    ('feature.ads.google-adsense.enabled', 'false', 'features', 'Enable Google AdSense display ads'),
    ('ads.google-adsense.client-id', '', 'system', 'Google AdSense client ID (ca-pub-xxxxxxxxxxxxxxxx)'),
    ('ads.google-adsense.slot-top', '', 'system', 'Google AdSense ad slot for top of search results (top-banner)'),
    ('ads.google-adsense.slot-sidebar', '', 'system', 'Google AdSense ad slot for sidebar (sidebar-unit)'),
    ('ads.google-adsense.slot-bottom', '', 'system', 'Google AdSense ad slot for bottom of page (bottom-banner)'),
    ('ads.display-location.search-results-top', 'true', 'system', 'Display ads at top of search results'),
    ('ads.display-location.route-details-sidebar', 'false', 'system', 'Display ads in route details sidebar'),
    ('ads.display-location.bottom-sticky', 'false', 'system', 'Display sticky ad at bottom of page');

SELECT 'V105: Google AdSense advertising system settings added' as migration_status;
