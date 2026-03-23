-- Add market_value field and modify karat to support string values (including "N/A")
-- Migration V8: Add market value and modify item fields

-- Add market_value column to pawn_transaction_items
ALTER TABLE pawn_transaction_items
ADD COLUMN market_value DECIMAL(18, 2) DEFAULT NULL;

-- Modify karat column from INTEGER to VARCHAR to support "N/A" and string values like "22K"
-- First, create a backup of existing karat values
ALTER TABLE pawn_transaction_items
ADD COLUMN karat_backup INTEGER;

UPDATE pawn_transaction_items
SET karat_backup = karat;

-- Drop the old karat column and create new VARCHAR column
ALTER TABLE pawn_transaction_items
DROP COLUMN karat;

ALTER TABLE pawn_transaction_items
ADD COLUMN karat VARCHAR(10) DEFAULT 'N/A';

-- Restore existing karat values by converting integers to strings (e.g., 22 -> "22K")
UPDATE pawn_transaction_items
SET karat = CASE
    WHEN karat_backup IS NOT NULL THEN CONCAT(CAST(karat_backup AS VARCHAR), 'K')
    ELSE 'N/A'
END
WHERE karat_backup IS NOT NULL;

-- Clean up backup column
ALTER TABLE pawn_transaction_items
DROP COLUMN karat_backup;

-- Make item_description nullable (optional field)
ALTER TABLE pawn_transaction_items
ALTER COLUMN item_description DROP NOT NULL;

