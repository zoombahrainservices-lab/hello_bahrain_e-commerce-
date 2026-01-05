-- Migration: Add reference tracking fields to checkout_sessions for BenefitPay Wallet
-- Run this in Supabase SQL Editor

-- Add reference tracking fields
ALTER TABLE checkout_sessions
ADD COLUMN IF NOT EXISTS reference_number VARCHAR(255),
ADD COLUMN IF NOT EXISTS reference_attempt INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_reference_at TIMESTAMP WITH TIME ZONE;

-- Add index for faster lookups by reference number
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_reference_number 
ON checkout_sessions(reference_number) 
WHERE reference_number IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN checkout_sessions.reference_number IS 'Current BenefitPay Wallet reference number (unique per attempt)';
COMMENT ON COLUMN checkout_sessions.reference_attempt IS 'Number of payment attempts for this session (increments on retry)';
COMMENT ON COLUMN checkout_sessions.last_reference_at IS 'Timestamp of last reference number generation';

