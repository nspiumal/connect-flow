-- Add pattern mode flag for special-pattern transactions
-- A = normal transaction, B = pattern-entered transaction
-- This migration is safe for both new and existing databases

ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS pattern_mode VARCHAR(1) NOT NULL DEFAULT 'A';

-- Add index for pattern mode if it doesn't exist
ALTER TABLE pawn_transactions
ADD INDEX IF NOT EXISTS idx_pattern_mode (pattern_mode);

-- Normalize any unexpected values to A
UPDATE pawn_transactions
SET pattern_mode = 'A'
WHERE pattern_mode IS NULL OR pattern_mode NOT IN ('A', 'B');

