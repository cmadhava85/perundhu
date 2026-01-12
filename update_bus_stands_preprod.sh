#!/bin/bash

echo "Updating major bus stands in PREPROD to City - Stand Name format..."
echo ""

# Connect to preprod database via gcloud sql connect
gcloud sql connect perundhu-preprod-mysql \
  --user=root \
  --project=astute-strategy-406601 <<'SQLEOF'

-- Update bus stands to City - Stand Name format
UPDATE locations SET name = 'Madurai - Arappalayam' WHERE name = 'Arappalayam Bus Stand';
UPDATE locations SET name = 'Dharapuram - Main' WHERE name = 'Dharapuram Main Bus Stand';
UPDATE locations SET name = 'Dasarapalle - Central' WHERE name = 'Dasarapalle Bus Stop';
UPDATE locations SET name = 'Parappil - Central' WHERE name = 'Parappil Bus Stand';

-- Verify the updates
SELECT 'Verification - Updated Bus Stands:' as status;
SELECT DISTINCT name FROM locations 
WHERE name IN ('Madurai - Arappalayam', 'Madurai - Mattuthavani', 'Madurai - Periyar', 
               'Dharapuram - Main', 'Dasarapalle - Central', 'Parappil - Central')
ORDER BY name;

SQLEOF

echo ""
echo "✅ Preprod database updated successfully!"
