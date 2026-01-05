-- Add benefit_track_id column to orders table
-- This stores the numeric trackId used for BenefitPay transactions
-- The trackId is mapped to the orderId (UUID) for lookup

-- Add the column
ALTER TABLE orders ADD COLUMN IF NOT EXISTS benefit_track_id VARCHAR(50);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_orders_benefit_track_id ON orders(benefit_track_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.benefit_track_id IS 'Numeric trackId used for BenefitPay transactions (timestamp-based)';


