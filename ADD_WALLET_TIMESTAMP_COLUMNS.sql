-- Add timestamp columns for BenefitPay Wallet transaction tracking
-- These timestamps help with debugging and performance analysis

ALTER TABLE checkout_sessions
ADD COLUMN IF NOT EXISTS wallet_open_called_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wallet_callback_returned_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wallet_first_check_status_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS wallet_final_status_at TIMESTAMP WITH TIME ZONE;

-- Add index for querying by timestamps
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_wallet_timestamps 
ON checkout_sessions(wallet_open_called_at, wallet_final_status_at) 
WHERE wallet_open_called_at IS NOT NULL;

COMMENT ON COLUMN checkout_sessions.wallet_open_called_at IS 'Timestamp when InApp.open() was called';
COMMENT ON COLUMN checkout_sessions.wallet_callback_returned_at IS 'Timestamp when SDK callback (success/error/close) was received';
COMMENT ON COLUMN checkout_sessions.wallet_first_check_status_at IS 'Timestamp when first check-status API call was made';
COMMENT ON COLUMN checkout_sessions.wallet_final_status_at IS 'Timestamp when final payment status was confirmed (PAID/FAILED)';

