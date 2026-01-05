-- Add BenefitPay Wallet specific fields to orders table
-- This migration adds fields to store wallet transaction details for reconciliation

-- Add wallet-specific fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS rrn VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS receipt_number VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS gateway VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS payment_raw_response JSONB;

-- Create index on reference_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_reference_number ON orders(reference_number);

-- Add comments for documentation
COMMENT ON COLUMN orders.reference_number IS 'BenefitPay Wallet reference number (format: HB_sessionid_timestamp)';
COMMENT ON COLUMN orders.rrn IS 'Retrieval Reference Number from BenefitPay';
COMMENT ON COLUMN orders.receipt_number IS 'Receipt number from BenefitPay transaction';
COMMENT ON COLUMN orders.gateway IS 'Payment gateway used (e.g., benefitpay, eazypay)';
COMMENT ON COLUMN orders.payment_raw_response IS 'Full JSON response from payment gateway for debugging';

-- Note: payment_method column already supports 'benefitpay_wallet' as it accepts VARCHAR/string values
-- The existing payment_provider column can be used to distinguish between different providers

