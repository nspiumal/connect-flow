-- Add new fields to pawn_transactions table
-- ID Type, Gender, Item Content, and Item Condition

-- Add id_type column (default: NIC)
ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS id_type VARCHAR(50) DEFAULT 'NIC';

-- Add gender column
ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS gender VARCHAR(20);

-- Add item_content column (item type: Ring, Chain, etc.)
ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS item_content VARCHAR(100);

-- Add item_condition column (default: Good)
ALTER TABLE pawn_transactions
ADD COLUMN IF NOT EXISTS item_condition VARCHAR(50) DEFAULT 'Good';

-- Add comments for documentation
COMMENT ON COLUMN pawn_transactions.id_type IS 'Type of identification: NIC, Passport, or DrivingLicense';
COMMENT ON COLUMN pawn_transactions.gender IS 'Customer gender: Male, Female, or Other';
COMMENT ON COLUMN pawn_transactions.item_content IS 'Type of gold item: Ring, Chain, Bracelet, etc.';
COMMENT ON COLUMN pawn_transactions.item_condition IS 'Condition of item: Excellent, Good, Fair, or Poor';

