-- Add first-month rate support while keeping existing normal rate for weekly accrual.

ALTER TABLE interest_rates
ADD COLUMN IF NOT EXISTS first_month_rate_percent DECIMAL(5,2) NULL;

-- Prefer weekly-derived values if present from V15, else derive from normal rate.
UPDATE interest_rates
SET first_month_rate_percent = ROUND(COALESCE(weekly_rate_percent, rate_percent / 12), 2)
WHERE first_month_rate_percent IS NULL;

ALTER TABLE interest_rates
MODIFY COLUMN first_month_rate_percent DECIMAL(5,2) NOT NULL;

ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS first_month_interest_rate_percent DECIMAL(5,2) NULL;

UPDATE pawn_transactions
SET first_month_interest_rate_percent = ROUND(COALESCE(weekly_interest_rate_percent, interest_rate_percent / 12), 2)
WHERE first_month_interest_rate_percent IS NULL;

ALTER TABLE pawn_transactions
MODIFY COLUMN first_month_interest_rate_percent DECIMAL(5,2) NOT NULL;

