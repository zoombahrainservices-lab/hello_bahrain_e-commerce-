-- Migration: Add checkout_session_id to orders table for idempotency
-- Run this in Supabase SQL Editor

-- Add checkout_session_id column
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS checkout_session_id UUID REFERENCES checkout_sessions(id) ON DELETE SET NULL;

-- Add UNIQUE constraint to prevent duplicate orders from same session
ALTER TABLE orders
ADD CONSTRAINT unique_checkout_session_id UNIQUE (checkout_session_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_checkout_session_id 
ON orders(checkout_session_id) 
WHERE checkout_session_id IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN orders.checkout_session_id IS 'Reference to checkout session - ensures idempotency (one order per session)';
COMMENT ON CONSTRAINT unique_checkout_session_id ON orders IS 'Prevents duplicate orders from the same checkout session';


