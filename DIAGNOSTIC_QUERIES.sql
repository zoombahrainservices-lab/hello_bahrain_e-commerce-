-- Diagnostic SQL Queries for Faster Checkout Token Storage
-- Run these in Supabase SQL Editor to diagnose token storage issues

-- ============================================
-- 1. CHECK IF TABLE EXISTS
-- ============================================
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'benefit_payment_tokens'
) as table_exists;

-- If returns false, run ADD_BENEFIT_FASTER_CHECKOUT.sql migration!

-- ============================================
-- 2. CHECK TABLE STRUCTURE
-- ============================================
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'benefit_payment_tokens'
ORDER BY ordinal_position;

-- ============================================
-- 3. COUNT ALL TOKENS
-- ============================================
SELECT 
  COUNT(*) as total_tokens,
  COUNT(*) FILTER (WHERE status = 'active') as active_tokens,
  COUNT(*) FILTER (WHERE status = 'deleted') as deleted_tokens,
  COUNT(DISTINCT user_id) as unique_users
FROM benefit_payment_tokens;

-- ============================================
-- 4. VIEW ALL TOKENS (Last 20)
-- ============================================
SELECT 
  id,
  user_id,
  card_alias,
  last_4_digits,
  card_type,
  is_default,
  status,
  payment_id,
  order_id,
  created_at,
  updated_at
FROM benefit_payment_tokens
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 5. CHECK TOKENS FOR SPECIFIC USER
-- Replace 'your-user-id-here' with actual UUID
-- ============================================
SELECT 
  id,
  card_alias,
  last_4_digits,
  card_type,
  is_default,
  status,
  payment_id,
  order_id,
  created_at
FROM benefit_payment_tokens
WHERE user_id = 'your-user-id-here'
ORDER BY created_at DESC;

-- ============================================
-- 6. FIND RECENT ORDERS WITHOUT TOKENS
-- (Orders that should have tokens but don't)
-- ============================================
SELECT 
  o.id as order_id,
  o.user_id,
  o.created_at as order_date,
  o.payment_method,
  o.status as order_status,
  cs.benefit_payment_id,
  CASE 
    WHEN bpt.id IS NULL THEN '❌ NO TOKEN'
    ELSE '✅ HAS TOKEN'
  END as token_status,
  bpt.id as token_id,
  bpt.card_alias
FROM orders o
LEFT JOIN checkout_sessions cs ON cs.id = o.checkout_session_id
LEFT JOIN benefit_payment_tokens bpt ON bpt.order_id = o.id
WHERE o.payment_method = 'card'
  AND o.created_at > NOW() - INTERVAL '7 days'
ORDER BY o.created_at DESC
LIMIT 50;

-- ============================================
-- 7. COUNT TOKENS BY USER
-- ============================================
SELECT 
  user_id,
  COUNT(*) as token_count,
  COUNT(*) FILTER (WHERE is_default = true) as default_tokens,
  MAX(created_at) as latest_token_date,
  MIN(created_at) as first_token_date
FROM benefit_payment_tokens
WHERE status = 'active'
GROUP BY user_id
ORDER BY latest_token_date DESC;

-- ============================================
-- 8. CHECK FOR DUPLICATE TOKENS
-- (Should not happen due to idempotency, but good to check)
-- ============================================
SELECT 
  token_hash,
  user_id,
  COUNT(*) as duplicate_count,
  array_agg(id) as token_ids,
  array_agg(created_at) as created_dates
FROM benefit_payment_tokens
WHERE status = 'active'
GROUP BY token_hash, user_id
HAVING COUNT(*) > 1;

-- ============================================
-- 9. CHECK TOKENS BY PAYMENT ID
-- ============================================
SELECT 
  payment_id,
  user_id,
  card_alias,
  last_4_digits,
  created_at
FROM benefit_payment_tokens
WHERE payment_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 20;

-- ============================================
-- 10. CHECK TOKENS BY ORDER ID
-- ============================================
SELECT 
  bpt.order_id,
  o.user_id as order_user_id,
  bpt.user_id as token_user_id,
  bpt.card_alias,
  bpt.created_at as token_created,
  o.created_at as order_created
FROM benefit_payment_tokens bpt
LEFT JOIN orders o ON o.id = bpt.order_id
WHERE bpt.order_id IS NOT NULL
ORDER BY bpt.created_at DESC
LIMIT 20;

-- ============================================
-- 11. FIND TOKENS CREATED IN LAST 24 HOURS
-- ============================================
SELECT 
  id,
  user_id,
  card_alias,
  last_4_digits,
  card_type,
  status,
  created_at
FROM benefit_payment_tokens
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- ============================================
-- 12. CHECK FOR TOKENS WITH MISSING CARD INFO
-- ============================================
SELECT 
  id,
  user_id,
  card_alias,
  last_4_digits,
  card_type,
  payment_id,
  created_at
FROM benefit_payment_tokens
WHERE (card_alias IS NULL OR last_4_digits IS NULL)
  AND status = 'active'
ORDER BY created_at DESC;

-- ============================================
-- 13. SUMMARY STATISTICS
-- ============================================
SELECT 
  'Total Tokens' as metric,
  COUNT(*)::text as value
FROM benefit_payment_tokens
UNION ALL
SELECT 
  'Active Tokens',
  COUNT(*)::text
FROM benefit_payment_tokens
WHERE status = 'active'
UNION ALL
SELECT 
  'Unique Users',
  COUNT(DISTINCT user_id)::text
FROM benefit_payment_tokens
WHERE status = 'active'
UNION ALL
SELECT 
  'Tokens Last 7 Days',
  COUNT(*)::text
FROM benefit_payment_tokens
WHERE created_at > NOW() - INTERVAL '7 days'
UNION ALL
SELECT 
  'Tokens Last 24 Hours',
  COUNT(*)::text
FROM benefit_payment_tokens
WHERE created_at > NOW() - INTERVAL '24 hours'
UNION ALL
SELECT 
  'Default Tokens',
  COUNT(*)::text
FROM benefit_payment_tokens
WHERE is_default = true AND status = 'active';

