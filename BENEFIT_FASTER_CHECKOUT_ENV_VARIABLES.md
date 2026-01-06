# Benefit Pay Faster Checkout - Environment Variables

## Required Environment Variables

Add these environment variables to your `.env.local` file (for local development) and to your Vercel project settings (for production).

### Feature Flags

```env
# Enable/disable Faster Checkout feature
# Set to 'true' to enable, 'false' to disable
# Default: false (feature is disabled by default for safety)
BENEFIT_FASTER_CHECKOUT_ENABLED=false

# Frontend feature flag (for UI display)
# Must match BENEFIT_FASTER_CHECKOUT_ENABLED
# Default: false
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=false
```

### Token Encryption

```env
# Token encryption key for storing payment tokens securely
# Can use the same key as BENEFIT_RESOURCE_KEY or a separate key
# If not provided, will fall back to BENEFIT_RESOURCE_KEY
# Recommended: Use a separate 32-character key for additional security
BENEFIT_TOKEN_ENCRYPTION_KEY=your_32_character_encryption_key_here
```

## Setup Instructions

### 1. Local Development (.env.local)

Add to `client/.env.local`:

```env
# Benefit Pay Faster Checkout
BENEFIT_FASTER_CHECKOUT_ENABLED=false
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=false
BENEFIT_TOKEN_ENCRYPTION_KEY=your_32_character_key_here
```

### 2. Production (Vercel)

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add the following variables:
   - `BENEFIT_FASTER_CHECKOUT_ENABLED` = `false` (set to `true` when ready)
   - `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED` = `false` (set to `true` when ready)
   - `BENEFIT_TOKEN_ENCRYPTION_KEY` = Your 32-character encryption key

### 3. Generate Encryption Key

You can generate a secure 32-character key using:

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 16
```

## Security Notes

1. **Never commit encryption keys to git** - Always use environment variables
2. **Use different keys for development and production** - Never reuse production keys
3. **Rotate keys periodically** - If a key is compromised, all tokens must be re-encrypted
4. **Keep keys secure** - Store in secure password managers, never share via email/chat

## Feature Rollout Strategy

### Phase 1: Testing (Feature Disabled)
```env
BENEFIT_FASTER_CHECKOUT_ENABLED=false
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=false
```
- All existing payment flows work normally
- No token storage occurs
- UI elements are hidden

### Phase 2: Enable Token Storage (Backend Only)
```env
BENEFIT_FASTER_CHECKOUT_ENABLED=true
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=false
```
- Tokens are stored after successful payments
- UI for using saved cards is hidden
- Allows testing token storage without UI changes

### Phase 3: Full Feature (Production Ready)
```env
BENEFIT_FASTER_CHECKOUT_ENABLED=true
NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true
```
- Full Faster Checkout feature enabled
- Users can save cards and use saved cards
- All functionality active

## Verification

After setting environment variables, verify:

1. **Backend feature flag:**
   - Check server logs for `[BENEFIT Notify]` or `[BENEFIT Process]` messages
   - Should see token extraction attempts if enabled

2. **Frontend feature flag:**
   - Visit `/checkout/payment` page
   - Select "BenefitPay" payment method
   - Should see "Use saved card" and "Save card" options if enabled

3. **Token storage:**
   - Complete a successful payment
   - Check `benefit_payment_tokens` table in database
   - Should see encrypted token stored (if feature enabled)

## Troubleshooting

### Feature not showing in UI
- Verify `NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- Clear browser cache
- Restart development server

### Tokens not being stored
- Verify `BENEFIT_FASTER_CHECKOUT_ENABLED=true`
- Check server logs for token extraction errors
- Verify `BENEFIT_TOKEN_ENCRYPTION_KEY` is set
- Check that payment response contains token field (may need to check BENEFIT docs for exact field name)

### Token decryption errors
- Verify `BENEFIT_TOKEN_ENCRYPTION_KEY` is exactly 32 characters
- Ensure same key is used for encryption and decryption
- Check that key hasn't been changed between token storage and retrieval


