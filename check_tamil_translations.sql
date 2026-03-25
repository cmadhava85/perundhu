-- Check Tamil translations for Chennai and Madurai
SELECT l.id, l.name, t.translated_value as tamil_name
FROM location l
LEFT JOIN translation t ON t.entity_id = l.id 
  AND t.entity_type = 'location' 
  AND t.language = 'ta'
WHERE l.name IN ('Chennai', 'Madurai')
ORDER BY l.id;
