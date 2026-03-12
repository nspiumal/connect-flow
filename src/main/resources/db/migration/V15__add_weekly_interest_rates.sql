-- Add weekly rate support for month+weekly redemption calculations

ALTER TABLE interest_rates
ADD COLUMN IF NOT EXISTS weekly_rate_percent DECIMAL(5,2) NULL;

UPDATE interest_rates
SET weekly_rate_percent = ROUND(rate_percent / 4, 2)
WHERE weekly_rate_percent IS NULL;

ALTER TABLE interest_rates
MODIFY COLUMN weekly_rate_percent DECIMAL(5,2) NOT NULL;

ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS weekly_interest_rate_percent DECIMAL(5,2) NULL;

UPDATE pawn_transactions
SET weekly_interest_rate_percent = ROUND(interest_rate_percent / 4, 2)
WHERE weekly_interest_rate_percent IS NULL;

ALTER TABLE pawn_transactions
MODIFY COLUMN weekly_interest_rate_percent DECIMAL(5,2) NOT NULL;

