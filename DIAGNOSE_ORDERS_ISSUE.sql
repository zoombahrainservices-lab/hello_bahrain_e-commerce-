-- Diagnostic Queries for Orders Not Showing Issue
-- Run these queries in Supabase SQL Editor to diagnose the problem

-- 1. Check all orders for a specific user (replace USER_ID with actual user ID)
-- To find your user ID, check the auth.users table or use the user_id from an order that IS showing
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.status,
  o.payment_status,
  o.payment_method,
  o.created_at,
  COUNT(oi.id) as item_count,
  CASE 
    WHEN COUNT(oi.id) = 0 THEN 'NO ITEMS'
    ELSE 'HAS ITEMS'
  END as items_status
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user_id
GROUP BY o.id, o.user_id, o.total, o.status, o.payment_status, o.payment_method, o.created_at
ORDER BY o.created_at DESC;

-- 2. Check orders WITHOUT order_items (these might be the missing ones)
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.status,
  o.payment_status,
  o.payment_method,
  o.created_at,
  'MISSING ITEMS' as issue
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.user_id = 'YOUR_USER_ID_HERE'  -- Replace with actual user_id
  AND oi.id IS NULL
ORDER BY o.created_at DESC;

-- 3. Check ALL columns in orders table for a specific order
-- Replace ORDER_ID with an order ID that's NOT showing (e.g., the one starting with 7f85c)
SELECT *
FROM orders
WHERE id = 'ORDER_ID_HERE'  -- Replace with actual order ID
LIMIT 1;

-- 4. Check order_items for a specific order
SELECT *
FROM order_items
WHERE order_id = 'ORDER_ID_HERE'  -- Replace with actual order ID
ORDER BY created_at;

-- 5. Compare showing vs not showing orders
-- Replace USER_ID and ORDER_ID_SHOWING with actual values
SELECT 
  'SHOWING' as status,
  o.*
FROM orders o
WHERE o.id = 'ORDER_ID_SHOWING'  -- An order that IS showing (e.g., 4b0af344...)

UNION ALL

SELECT 
  'NOT SHOWING' as status,
  o.*
FROM orders o
WHERE o.id = 'ORDER_ID_NOT_SHOWING'  -- An order that is NOT showing (e.g., 7f85c...)
ORDER BY created_at DESC;

-- 6. Check for RLS (Row Level Security) policies that might block orders
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename IN ('orders', 'order_items');

-- 7. List all columns in orders table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'orders'
ORDER BY ordinal_position;

-- 8. List all columns in order_items table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'order_items'
ORDER BY ordinal_position;

-- 9. Check recent orders with their item counts
SELECT 
  o.id,
  o.user_id,
  o.total,
  o.status,
  o.payment_status,
  o.payment_method,
  o.created_at,
  COUNT(oi.id) as item_count,
  STRING_AGG(oi.name, ', ') as item_names
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
WHERE o.created_at >= NOW() - INTERVAL '7 days'
GROUP BY o.id, o.user_id, o.total, o.status, o.payment_status, o.payment_method, o.created_at
ORDER BY o.created_at DESC
LIMIT 20;


