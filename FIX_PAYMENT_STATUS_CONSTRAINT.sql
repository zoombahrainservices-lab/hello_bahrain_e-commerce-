-- Fix payment_status CHECK constraint to allow 'failed' status
-- Run this in Supabase SQL Editor

-- First, drop the existing constraint if it exists
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Add new constraint that allows 'unpaid', 'paid', and 'failed'
ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('unpaid', 'paid', 'failed'));

-- Verify the constraint was added
-- SELECT conname, pg_get_constraintdef(oid) 
-- FROM pg_constraint 
-- WHERE conrelid = 'orders'::regclass 
-- AND conname = 'orders_payment_status_check';


