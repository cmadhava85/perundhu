-- V121: Drop image_data LONGBLOB from image_contributions table
-- Images are now stored in GCS; image_url holds the GCS object URL.
-- This frees significant disk space on the db-f1-micro (10GB HDD) instance.

ALTER TABLE image_contributions DROP COLUMN IF EXISTS image_data;
