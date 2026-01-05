-- Migration: Add Benefit Pay Faster Checkout (Token Storage)
-- Run this in Supabase SQL Editor
-- This creates a new table for storing payment tokens securely

-- Create benefit_payment_tokens table
CREATE TABLE IF NOT EXISTS benefit_payment_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(500) NOT NULL, -- Encrypted token from Benefit Pay (increased size for encrypted data)
  token_hash VARCHAR(255) NOT NULL, -- Hash for duplicate detection
  card_alias VARCHAR(100), -- User-friendly card identifier (e.g., "Visa ****1234")
  last_4_digits VARCHAR(4), -- Last 4 digits of card
  card_type VARCHAR(50), -- e.g., "VISA", "MASTERCARD"
  is_default BOOLEAN DEFAULT false, -- Default card for user
  status VARCHAR(20) DEFAULT 'active', -- active, expired, deleted
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Token expiry if provided by Benefit
  payment_id VARCHAR(255), -- Benefit payment ID that created this token
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL -- Order that created token
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_benefit_tokens_user_id ON benefit_payment_tokens(user_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_benefit_tokens_token_hash ON benefit_payment_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_benefit_tokens_payment_id ON benefit_payment_tokens(payment_id);

-- Unique constraint: one token per payment (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS idx_benefit_tokens_payment_unique ON benefit_payment_tokens(payment_id) WHERE payment_id IS NOT NULL;

-- Ensure only one default token per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_benefit_tokens_user_default ON benefit_payment_tokens(user_id) WHERE is_default = true AND status = 'active';

-- Add comments for documentation
COMMENT ON TABLE benefit_payment_tokens IS 'Stores encrypted payment tokens for Benefit Pay Faster Checkout feature';
COMMENT ON COLUMN benefit_payment_tokens.token IS 'Encrypted payment token from Benefit Pay (AES-256-GCM encrypted)';
COMMENT ON COLUMN benefit_payment_tokens.token_hash IS 'SHA-256 hash of token for duplicate detection and idempotency';
COMMENT ON COLUMN benefit_payment_tokens.payment_id IS 'Benefit payment ID that created this token (for idempotency)';
COMMENT ON COLUMN benefit_payment_tokens.status IS 'Token status: active, expired, deleted';

