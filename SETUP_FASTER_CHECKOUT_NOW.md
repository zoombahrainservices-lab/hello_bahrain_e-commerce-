# Setup Faster Checkout - Action Required

## ✅ Step 1: Environment Variables - COMPLETED
The `.env.local` file has been created with all required variables including:
- `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- `BENEFIT_TOKEN_ENCRYPTION_KEY=FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf`

## ⚠️ Step 2: Database Table - ACTION REQUIRED

You need to create the `benefit_payment_tokens` table in Supabase.

### Instructions:

1. **Open Supabase Dashboard:**
   - Go to https://app.supabase.com
   - Select your project (clmhzxiuzqvebzlkbdjs)

2. **Go to SQL Editor:**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and paste this SQL:**

```sql
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
```

4. **Run the Query:**
   - Click "RUN" or press Ctrl+Enter
   - You should see "Success. No rows returned"

5. **Verify the Table:**
   - Run this query to verify:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_name = 'benefit_payment_tokens';
   ```
   - Should return one row with 'benefit_payment_tokens'

## Step 3: Restart Server (After Database Setup)

Once you've created the database table, restart your development server:

```bash
cd client
npm run dev
```

## Step 4: Test the Feature

1. **Go to checkout page:** http://localhost:3000/checkout/payment
2. **Select "Credit / Debit Card"** payment method
3. **You should now see:** "Save card for faster checkout" checkbox
4. **Check the box** and complete a test payment
5. **Check database** to verify token was saved:
   ```sql
   SELECT id, user_id, card_alias, last_4_digits, card_type, is_default, created_at
   FROM benefit_payment_tokens
   WHERE status = 'active'
   ORDER BY created_at DESC;
   ```

6. **Test using saved card:**
   - Go to checkout again
   - Select "Credit / Debit Card"
   - You should now see "Use saved card" option with your saved card in dropdown

## What's Been Done

✅ Created `.env.local` with all required environment variables
✅ Feature flags enabled (BENEFIT_FASTER_CHECKOUT_ENABLED=true)
✅ Encryption key generated (FkJ01WBI2e9OpChdlbALE4m8YUHGNVSf)
✅ Code already fixed to pass saveCard flag to API

## What You Need to Do

1. ⚠️ Create database table in Supabase (instructions above)
2. ⚠️ Restart development server
3. ⚠️ Test the feature

## Troubleshooting

### If "Save card" checkbox doesn't appear:
- Make sure server is restarted after creating .env.local
- Check browser console for errors
- Verify you selected "Credit / Debit Card" (not BenefitPay Wallet)

### If tokens aren't being saved:
- Check server logs after payment
- Look for: `[BENEFIT Notify] Token received...`
- Verify database table exists
- Contact Benefit Pay to ensure tokenization is enabled for your merchant account

## Next Steps After Testing

Once local testing works:
1. Add same environment variables to Vercel
2. Run database migration in production Supabase
3. Redeploy application


