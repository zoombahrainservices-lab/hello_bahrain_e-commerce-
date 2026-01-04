-- Migration: Add EazyPay payment fields to orders table
-- Run this in Supabase SQL Editor

-- Add payment-related columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS global_transactions_id VARCHAR(255),
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50),
ADD COLUMN IF NOT EXISTS paid_on TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_raw_response JSONB,
ADD COLUMN IF NOT EXISTS user_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS dcc_uptake VARCHAR(50),
ADD COLUMN IF NOT EXISTS dcc_receipt_text TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_global_transactions_id ON orders(global_transactions_id);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_paid_on ON orders(paid_on);

-- Add comment for documentation
COMMENT ON COLUMN orders.global_transactions_id IS 'EazyPay global transaction ID';
COMMENT ON COLUMN orders.payment_method IS 'Payment method: card, benefit, cod, etc.';
COMMENT ON COLUMN orders.paid_on IS 'Timestamp when payment was completed';
COMMENT ON COLUMN orders.payment_raw_response IS 'Raw JSON response from EazyPay API';
COMMENT ON COLUMN orders.user_token IS 'EazyPay user token for returning customers';
COMMENT ON COLUMN orders.dcc_uptake IS 'Dynamic Currency Conversion status';
COMMENT ON COLUMN orders.dcc_receipt_text IS 'DCC receipt text (sanitized HTML)';

