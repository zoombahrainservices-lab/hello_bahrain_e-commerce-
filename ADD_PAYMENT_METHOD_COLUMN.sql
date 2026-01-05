-- Add payment_method column to orders table if it doesn't exist
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50);

-- Add index for payment method queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_method ON orders(payment_method) WHERE payment_method IS NOT NULL;

-- Add comment
COMMENT ON COLUMN orders.payment_method IS 'Payment method: cod, benefit, card, etc.';

