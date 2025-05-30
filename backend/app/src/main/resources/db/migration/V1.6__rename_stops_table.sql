-- Rename stops table to stop if it exists
SET @table_exists = (SELECT COUNT(*) 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE()
    AND table_name = 'stops');

SET @rename_statement = IF(@table_exists > 0,
    'RENAME TABLE stops TO stop',
    'SELECT 1');

PREPARE stmt FROM @rename_statement;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;