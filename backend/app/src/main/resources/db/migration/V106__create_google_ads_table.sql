-- V106: Create dedicated google_ads table for ad unit management
-- Stores Google AdSense ad unit configurations and placements

CREATE TABLE IF NOT EXISTS google_ads (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ad_unit_name VARCHAR(100) NOT NULL COLLATE utf8mb4_unicode_ci,
    ad_unit_id VARCHAR(100) COLLATE utf8mb4_unicode_ci,
    placement_type VARCHAR(50) NOT NULL COLLATE utf8mb4_unicode_ci COMMENT 'search_results, route_details, contribution_panel',
    ad_format VARCHAR(50) COLLATE utf8mb4_unicode_ci COMMENT 'leaderboard, rectangle, large_rectangle',
    width INT COMMENT 'Ad width in pixels',
    height INT COMMENT 'Ad height in pixels',
    position_order INT DEFAULT 1 COMMENT 'Display order in the page',
    is_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by VARCHAR(100) COLLATE utf8mb4_unicode_ci,
    notes VARCHAR(500) COLLATE utf8mb4_unicode_ci,
    UNIQUE KEY uk_ad_unit_placement (ad_unit_id, placement_type),
    INDEX idx_placement_type (placement_type),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Google AdSense ad unit placements and configurations';

-- Insert default ad placements from Phase 1 advertisement strategy
INSERT IGNORE INTO google_ads (
    ad_unit_name, ad_unit_id, placement_type, ad_format, width, height, position_order, is_enabled, created_by, notes
) VALUES
    ('Search Results - Top Banner', '', 'search_results', 'leaderboard', 728, 90, 1, false, 'system', 'Phase 1: Top of search results page'),
    ('Search Results - Sidebar', '', 'search_results', 'rectangle', 336, 280, 2, false, 'system', 'Phase 1: Sidebar unit for search page'),
    ('Route Details - Sidebar', '', 'route_details', 'rectangle', 336, 280, 1, false, 'system', 'Phase 1: Route details sidebar ad'),
    ('Bottom Sticky Banner', '', 'contribution_panel', 'leaderboard', 728, 90, 1, false, 'system', 'Phase 1: Sticky bottom banner');

SELECT 'V106: Google Ads table created with Phase 1 placements' as migration_status;
