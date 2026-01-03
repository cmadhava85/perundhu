-- V33: Expand status column to accommodate longer status values and error messages
-- Issue: status column was varchar(20) causing data truncation errors

ALTER TABLE image_contributions MODIFY COLUMN status VARCHAR(100) NOT NULL DEFAULT 'PENDING';

