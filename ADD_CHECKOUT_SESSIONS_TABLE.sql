-- Create checkout_sessions table for online payment attempts
CREATE TABLE IF NOT EXISTS checkout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL, -- Cart items snapshot: [{productId, quantity, name, price, image}]
    shipping_address JSONB NOT NULL, -- Shipping address snapshot
    total DECIMAL(10, 3) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'benefit' | 'card'
    status VARCHAR(20) NOT NULL DEFAULT 'initiated', -- 'initiated' | 'paid' | 'failed' | 'cancelled' | 'expired'
    
    -- Payment gateway tracking IDs
    benefit_track_id VARCHAR(255), -- For Benefit Pay
    benefit_payment_id VARCHAR(255), -- For Benefit Pay
    global_transactions_id VARCHAR(255), -- For EazyPay
    
    -- Inventory reservation tracking
    inventory_reserved_at TIMESTAMP WITH TIME ZONE,
    inventory_released_at TIMESTAMP WITH TIME ZONE,
    
    -- Expiry for cleanup
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (NOW() + INTERVAL '30 minutes'),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Order reference (set when order is created from session)
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_user_id ON checkout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_status ON checkout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_benefit_track_id ON checkout_sessions(benefit_track_id) WHERE benefit_track_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_global_transactions_id ON checkout_sessions(global_transactions_id) WHERE global_transactions_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_checkout_sessions_expires_at ON checkout_sessions(expires_at) WHERE status = 'initiated';

-- Enable RLS
ALTER TABLE checkout_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own checkout sessions"
ON checkout_sessions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own checkout sessions"
ON checkout_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE checkout_sessions IS 'Stores checkout session data for online payments before order creation';

