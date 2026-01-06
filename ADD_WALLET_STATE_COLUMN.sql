-- Add wallet_state column to checkout_sessions table
-- This enables explicit state machine tracking for BenefitPay Wallet payments

ALTER TABLE checkout_sessions
ADD COLUMN IF NOT EXISTS wallet_state VARCHAR(50);

-- Create index for querying by wallet state
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_wallet_state 
ON checkout_sessions(wallet_state) 
WHERE wallet_state IS NOT NULL;

-- Add constraint to ensure valid states
ALTER TABLE checkout_sessions
ADD CONSTRAINT IF NOT EXISTS checkout_sessions_wallet_state_check 
CHECK (
  wallet_state IS NULL OR 
  wallet_state IN (
    'INITIATED',
    'WALLET_POPUP_OPENED',
    'SDK_CALLBACK_SUCCESS',
    'SDK_CALLBACK_ERROR',
    'USER_CLOSED',
    'PENDING_STATUS_CHECK',
    'PAID',
    'FAILED',
    'EXPIRED',
    'UNKNOWN_NEEDS_MANUAL_REVIEW'
  )
);

COMMENT ON COLUMN checkout_sessions.wallet_state IS 'Explicit state machine state for BenefitPay Wallet payment flow: INITIATED -> WALLET_POPUP_OPENED -> SDK_CALLBACK_* -> PENDING_STATUS_CHECK -> PAID/FAILED/EXPIRED';

