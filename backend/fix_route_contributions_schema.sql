-- Fix for missing submitted_by column in route_contributions table
ALTER TABLE route_contributions ADD COLUMN submitted_by VARCHAR(255);

-- Update existing records with NULL for the new column
UPDATE route_contributions SET submitted_by = NULL;

-- Make sure there are no conflicts in the database entity sync
COMMIT;