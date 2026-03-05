-- Add pattern mode flag for special-pattern transactions
-- A = normal transaction, B = pattern-entered transaction

ALTER TABLE pawn_transactions
ADD COLUMN pattern_mode VARCHAR(1) NOT NULL DEFAULT 'A';

-- Normalize any unexpected values to A
UPDATE pawn_transactions
SET pattern_mode = 'A'
WHERE pattern_mode IS NULL OR pattern_mode NOT IN ('A', 'B');

