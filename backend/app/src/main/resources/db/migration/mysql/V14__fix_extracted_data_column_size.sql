-- V14__fix_extracted_data_column_size.sql
-- Fix extracted_data column to support larger OCR text data

-- Change extracted_data from VARCHAR(2000) to LONGTEXT to accommodate full OCR extraction results
ALTER TABLE image_contributions 
MODIFY COLUMN extracted_data LONGTEXT 
COMMENT 'OCR extracted data from images - can be large JSON with full text extraction';
