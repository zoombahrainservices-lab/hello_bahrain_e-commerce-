-- Migration: Add benefit_token_id column to orders table
-- Run this in Supabase SQL Editor

-- Add benefit_token_id column to store token ID from udf7 (Faster Checkout per spec v1.51)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS benefit_token_id VARCHAR(255);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_benefit_token_id ON orders(benefit_token_id) WHERE benefit_token_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.benefit_token_id IS 'Benefit Pay Faster Checkout token ID (from udf7 in response)';

