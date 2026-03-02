-- Add last_redemption_date column to pawn_transactions table
ALTER TABLE pawn_transactions
ADD COLUMN last_redemption_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN pawn_transactions.last_redemption_date IS 'Date of the most recent redemption payment - used as start date for next interest calculation';

