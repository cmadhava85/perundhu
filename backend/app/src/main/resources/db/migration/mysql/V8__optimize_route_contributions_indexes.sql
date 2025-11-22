-- V11: Add indexes for RouteContribution query optimization
-- This migration adds database indexes to support the optimized JPA queries
-- and eliminate N+1 query problems in RouteContributionRepositoryAdapter
-- Expected performance improvement: 10-100x faster for filtered queries

-- Index for findByStatus() query
-- Used by: Admin dashboard, status filtering
ALTER TABLE route_contributions ADD INDEX idx_route_contributions_status (status);

-- Index for findBySubmittedBy() query
-- Used by: User contribution history
ALTER TABLE route_contributions ADD INDEX idx_route_contributions_submitted_by (submitted_by);

-- Composite index for findBySubmittedByAndSubmissionDateAfter() query
-- Column order: submitted_by first (equality check), then submission_date (range check)
-- Used by: User activity tracking, recent contributions
ALTER TABLE route_contributions ADD INDEX idx_route_contributions_user_date (submitted_by, submission_date);

-- Composite index for existsByBusNumberAndFromLocationNameAndToLocationName() query
-- Covering index includes all columns used in the WHERE clause
-- Used by: Duplicate detection before insertion
ALTER TABLE route_contributions ADD INDEX idx_route_contributions_route_lookup (bus_number, from_location_name, to_location_name);

-- Performance notes:
-- 1. status index: Improves status-based filtering (PENDING, APPROVED, REJECTED)
-- 2. submitted_by index: Fast user-specific queries
-- 3. user_date composite: Optimizes date range queries per user
-- 4. route_lookup composite: Fast duplicate checking and route matching
--
-- These indexes support the optimized queries added in RouteContributionJpaRepository
-- and replace the previous findAll().stream().filter() anti-patterns
