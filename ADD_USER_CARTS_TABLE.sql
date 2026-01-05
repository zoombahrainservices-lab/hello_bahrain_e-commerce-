-- Create user_carts table for syncing cart across devices/environments
CREATE TABLE IF NOT EXISTS user_carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb, -- Cart items: [{productId, quantity, name, price, image, slug, stockQuantity}]
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- One cart per user
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_carts_user_id ON user_carts(user_id);

-- Enable RLS
ALTER TABLE user_carts ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own cart"
ON user_carts FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cart"
ON user_carts FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cart"
ON user_carts FOR UPDATE
USING (auth.uid() = user_id);

-- Add comment
COMMENT ON TABLE user_carts IS 'Stores user cart data for syncing across devices and environments';

