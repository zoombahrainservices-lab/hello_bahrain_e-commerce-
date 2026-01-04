-- Add BENEFIT Payment Gateway fields to orders table
-- Run this migration in Supabase SQL Editor

-- Add BENEFIT-specific payment fields to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS benefit_payment_id TEXT,
ADD COLUMN IF NOT EXISTS benefit_trans_id TEXT,
ADD COLUMN IF NOT EXISTS benefit_ref TEXT,
ADD COLUMN IF NOT EXISTS benefit_auth_resp_code TEXT;

-- Add comments to document the fields
COMMENT ON COLUMN orders.benefit_payment_id IS 'BENEFIT Payment ID from gateway';
COMMENT ON COLUMN orders.benefit_trans_id IS 'BENEFIT Transaction ID from response';
COMMENT ON COLUMN orders.benefit_ref IS 'BENEFIT Reference number from response';
COMMENT ON COLUMN orders.benefit_auth_resp_code IS 'BENEFIT Authorization response code (00 = approved)';

-- Create index for BENEFIT payment ID lookups
CREATE INDEX IF NOT EXISTS idx_orders_benefit_payment_id ON orders(benefit_payment_id) WHERE benefit_payment_id IS NOT NULL;

-- Create index for BENEFIT transaction ID lookups
CREATE INDEX IF NOT EXISTS idx_orders_benefit_trans_id ON orders(benefit_trans_id) WHERE benefit_trans_id IS NOT NULL;

-- Note: payment_status is likely TEXT/VARCHAR, not an enum
-- The 'failed' status can be used directly without modifying enum type
-- If payment_status is TEXT/VARCHAR, you can use 'failed' directly
-- If it IS an enum and you need to add 'failed', check the enum name first
