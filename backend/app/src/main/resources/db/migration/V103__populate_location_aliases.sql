-- V103__populate_location_aliases.sql
-- Populates location aliases for ALL locations
-- Purpose: Enable flexible location search for all location names

-- =====================================================
-- STRATEGY: Auto-populate aliases for ALL locations
-- =====================================================

-- =====================================================
-- 1. PRIMARY ALIASES: Exact location names
-- =====================================================
INSERT INTO location_aliases (location_id, alias_name, is_primary)
SELECT id, name COLLATE utf8mb4_unicode_ci, TRUE
FROM locations
WHERE name IS NOT NULL AND name != ''
