-- Migration: Add inventory reservation fields to orders table
-- Run this in Supabase SQL Editor
-- This migration adds fields for tracking inventory reservation state and timestamps

-- Create enum type for inventory status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE inventory_status_type AS ENUM ('reserved', 'sold', 'released');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add inventory reservation tracking columns to orders table
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS inventory_status inventory_status_type,
ADD COLUMN IF NOT EXISTS inventory_reserved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS inventory_released_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS inventory_restored_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reservation_expires_at TIMESTAMP WITH TIME ZONE;

-- Add index for cleanup queries (expired reservations)
CREATE INDEX IF NOT EXISTS idx_orders_reservation_expires 
ON orders(reservation_expires_at) 
WHERE payment_status = 'unpaid' AND inventory_status = 'reserved';

-- Add index for inventory status queries
CREATE INDEX IF NOT EXISTS idx_orders_inventory_status 
ON orders(inventory_status);

-- Add comments for documentation
COMMENT ON COLUMN orders.inventory_status IS 'Inventory state: reserved (awaiting payment), sold (paid and finalized), released (cancelled/expired)';
COMMENT ON COLUMN orders.inventory_reserved_at IS 'Timestamp when inventory was reserved for this order';
COMMENT ON COLUMN orders.inventory_released_at IS 'Timestamp when reserved inventory was released (expired/cancelled)';
COMMENT ON COLUMN orders.inventory_restored_at IS 'Timestamp when inventory was restored after cancellation (for idempotency)';
COMMENT ON COLUMN orders.reservation_expires_at IS 'Timestamp when reservation expires (typically 15-30 minutes after creation)';

-- Set default inventory_status for existing orders (treat as 'sold' for backward compatibility)
UPDATE orders 
SET inventory_status = 'sold' 
WHERE inventory_status IS NULL;

-- Create PostgreSQL function for atomic stock reservation
-- This function locks the product row and reserves stock atomically
CREATE OR REPLACE FUNCTION reserve_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Lock the product row for update (prevents concurrent modifications)
    SELECT stock_quantity INTO v_current_stock 
    FROM products 
    WHERE id = p_product_id 
    FOR UPDATE;
    
    -- Check if product exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;
    
    -- Check if sufficient stock is available
    IF v_current_stock < p_quantity THEN
        RAISE EXCEPTION 'Insufficient stock. Available: %, Requested: %', v_current_stock, p_quantity;
    END IF;
    
    -- Reserve the stock (deduct from available quantity)
    UPDATE products 
    SET stock_quantity = stock_quantity - p_quantity 
    WHERE id = p_product_id;
    
    -- Calculate and return new stock level
    v_new_stock := v_current_stock - p_quantity;
    RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- Create PostgreSQL function for atomic stock release
-- This function releases reserved stock back to available inventory
CREATE OR REPLACE FUNCTION release_stock(p_product_id UUID, p_quantity INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_current_stock INTEGER;
    v_new_stock INTEGER;
BEGIN
    -- Lock the product row for update
    SELECT stock_quantity INTO v_current_stock 
    FROM products 
    WHERE id = p_product_id 
    FOR UPDATE;
    
    -- Check if product exists
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found: %', p_product_id;
    END IF;
    
    -- Release the stock (add back to available quantity)
    UPDATE products 
    SET stock_quantity = stock_quantity + p_quantity 
    WHERE id = p_product_id;
    
    -- Calculate and return new stock level
    v_new_stock := v_current_stock + p_quantity;
    RETURN v_new_stock;
END;
$$ LANGUAGE plpgsql;

-- Add comments for functions
COMMENT ON FUNCTION reserve_stock(UUID, INTEGER) IS 'Atomically reserves stock for an order. Locks product row and deducts quantity. Returns new stock level.';
COMMENT ON FUNCTION release_stock(UUID, INTEGER) IS 'Atomically releases reserved stock back to inventory. Locks product row and adds quantity. Returns new stock level.';

