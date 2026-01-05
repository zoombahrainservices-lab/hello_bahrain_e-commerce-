# EazyPay Signature Error Fix

## The Error

```
EazyPay error (-4): Invalid number of inputs
```

This means the signature formula doesn't match what EazyPay expects.

## What Was Changed

1. **Default signature formula**: Changed from `all_fields` to `timestamp_only`
2. **New formula option**: Added `timestamp_only` formula

## Testing Different Formulas

The code now defaults to `timestamp_only`. If this doesn't work, try these formulas in order:

### Option 1: Timestamp Only (NEW DEFAULT)
```env
# No need to set - this is now the default
EAZYPAY_SIGNATURE_FORMULA=timestamp_only
```

### Option 2: Documented Formula (4 fields)
```env
EAZYPAY_SIGNATURE_FORMULA=documented
```

### Option 3: All Fields (7 fields)
```env
EAZYPAY_SIGNATURE_FORMULA=all_fields
```

### Option 4: Body Order
```env
EAZYPAY_SIGNATURE_FORMULA=body_order
```

### Option 5: Alphabetical Order
```env
EAZYPAY_SIGNATURE_FORMULA=alphabetical
```

## How to Test

1. **Restart the server** after making changes:
   ```bash
   npm run dev
   ```

2. **Try card payment** on checkout page

3. **Check the logs** for signature details

4. **If it fails**, try the next formula option

## What Each Formula Does

- **timestamp_only**: `timestamp`
- **documented**: `timestamp + currency + amount + appId`
- **all_fields**: `timestamp + appId + invoiceId + currency + amount + paymentMethod + returnUrl`
- **body_order**: Same as all_fields
- **alphabetical**: Fields in alphabetical order
- **documented_with_invoice**: `timestamp + invoiceId + currency + amount + appId + paymentMethod + returnUrl`

## Contact EazyPay Support

If none of these work, contact EazyPay support and ask:

**"What is the correct HMAC-SHA256 signature formula for the createInvoice endpoint?"**

Provide them with:
- Your App ID: `1988588907`
- The fields you're sending (see logs)
- The error you're getting

They should provide the exact formula.

## Current Status

- ✅ BENEFIT gateway: Fixed (handles array response)
- ⏳ EazyPay gateway: Testing `timestamp_only` formula


