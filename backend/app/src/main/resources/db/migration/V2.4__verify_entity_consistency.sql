-- V2.4__verify_entity_consistency.sql
-- This migration verifies and maintains consistency between database tables and JPA entities
-- MODIFIED: To standardize on 'stops' (plural) table name

-- Set strict SQL mode to catch errors
SET SQL_MODE = 'STRICT_TRANS_TABLES,NO_ZERO_DATE,NO_ZERO_IN_DATE,ERROR_FOR_DIVISION_BY_ZERO';
