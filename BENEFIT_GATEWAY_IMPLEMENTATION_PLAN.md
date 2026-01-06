# BENEFIT Payment Gateway Implementation Plan

## Current State Analysis

### What Exists
1. **EazyPay Integration** - Currently handles both "card" and "benefit" payment methods
   - API route: `/api/payments/eazypay/create-invoice`
   - Payment page: `/checkout/payment` with payment method selection
   - Both "card" and "benefit" options route through EazyPay

2. **Payment Flow**
   - User selects payment method (card/benefit/cod)
   - Order created with `payment_status: 'unpaid'`
   - For card/benefit: Calls EazyPay API
   - For cod: Direct order creation

3. **Payment Method Selection**
   - Location: `client/src/app/checkout/payment/page.tsx`
   - Options: `'card' | 'benefit' | 'cod'`
   - Currently: Both "card" and "benefit" use EazyPay

### What's Missing
1. **BENEFIT Gateway Implementation** - No direct BENEFIT gateway integration exists
2. **AES Encryption/Decryption** - No BENEFIT-specific crypto functions
3. **BENEFIT API Routes** - No init/response/error/notify endpoints
4. **BENEFIT Response Pages** - No response/error handling pages
5. **Environment Variables** - No BENEFIT credentials configured

---

## Implementation Strategy

### Option 1: Replace "benefit" Payment Method (Recommended)
- When user selects "benefit", use BENEFIT gateway instead of EazyPay
- Keep "card" using EazyPay
- Maintain "cod" as-is

### Option 2: Add as Separate Option
- Keep current flow (EazyPay handles benefit)
- Add new option like "BenefitPay Direct"
- More complex, requires UI changes

**Recommendation**: Option 1 (Replace) - Simpler, cleaner separation

---

## Implementation Plan

### Phase 1: Core Infrastructure (Steps 2-4)

#### Step 1: Environment Variables Setup
**File**: `client/.env.local`

Add these variables:
```env
# BENEFIT Payment Gateway
BENEFIT_TRANPORTAL_ID=your_tranportal_id
BENEFIT_TRANPORTAL_PASSWORD=your_tranportal_password
BENEFIT_RESOURCE_KEY=your_resource_key
BENEFIT_ENDPOINT=https://test.benefit-gateway.bh/payment/API/hosted.htm
```

#### Step 2: AES Encryption/Decryption Module
**New File**: `client/src/lib/services/benefit/crypto.ts`

**Functions to implement**:
- `encryptTrandata(plain: string, resourceKey: string): string`
  - AES-256-CBC mode
  - PKCS padding
  - IV: `PGKEYENCDECIVSPC` (ASCII bytes)
  - URL encode before encrypt
  - Return uppercase hex string

- `decryptTrandata(encryptedHex: string, resourceKey: string): string`
  - AES-256-CBC mode
  - PKCS padding
  - IV: `PGKEYENCDECIVSPC` (ASCII bytes)
  - URL decode after decrypt
  - Input: uppercase hex string

#### Step 3: Trandata Builder Module
**New File**: `client/src/lib/services/benefit/trandata.ts`

**Function to implement**:
- `buildPlainTrandata(params): string`
  - Builds JSON object with fields:
    - `amt` (amount)
    - `action = "1"` (purchase)
    - `password` (Tranportal password)
    - `id` (Tranportal ID)
    - `currencycode = "048"` (BHD)
    - `trackId` (order reference)
    - `udf1 = ""` (blank)
    - `responseURL`
    - `errorURL`
  - Returns JSON stringified array: `[{ ...fields... }]`

---

### Phase 2: API Routes (Steps 5, 7-9)

#### Step 4: Init Payment Route
**New File**: `client/src/app/api/payments/benefit/init/route.ts`

**Functionality**:
1. Validate user/auth
2. Validate order exists and belongs to user
3. Create unpaid order (if not exists)
4. Generate `trackId` (use order ID, numeric preferred)
5. Build plain trandata JSON
6. `encodeURIComponent(plainTrandataString)`
7. Encrypt to hex trandata
8. Call BENEFIT endpoint:
   ```json
   [{
     "id": "<TranportalID>",
     "trandata": "<ENCRYPTED_HEX>"
   }]
   ```
9. Parse response:
   - If `status == "1"`: Split `result` as `paymentId:paymentPageUrl`
   - Return redirect URL: `paymentPageUrl?PaymentID=paymentId`
   - If `status == "2"`: Throw error with `error` and `errorText`

#### Step 5: Response Handler Route
**New File**: `client/src/app/pay/benefit/response/page.tsx` (Client Component)

**Functionality**:
1. Read `trandata` from query parameter `?trandata=...`
2. Decrypt trandata using resource key and IV
3. URL-decode the decrypted text
4. Parse JSON array and take `[0]`
5. Validate:
   - `result` indicates success (`CAPTURED`)
   - `amt` matches order
   - `trackId` matches order
6. Store payment data: `paymentId`, `transId`, `ref`, `authRespCode`
7. Mark order as "paid"
8. Show success page

#### Step 6: Error Handler Route
**New File**: `client/src/app/pay/benefit/error/page.tsx` (Client Component)

**Functionality**:
1. Check if `trandata` exists in query
   - If yes: Decrypt and parse it
   - If no: Read `ErrorText`, `Error`, `paymentid`, `trackid`, `amt` directly from query
2. Mark order as "failed/cancelled"
3. Show error message

#### Step 7: Merchant Notification Route
**New File**: `client/src/app/api/payments/benefit/notify/route.ts`

**Functionality**:
1. Receive `trandata` (encrypted) from BENEFIT
2. Decrypt trandata
3. Validate transaction
4. Respond with acknowledgement JSON format (as per bank requirements)
5. **Critical**: Must acknowledge to prevent transaction void

**Note**: Only implement if Merchant Notification is enabled by bank

---

### Phase 3: Frontend Integration (Step 6)

#### Step 8: Update Payment Page
**File**: `client/src/app/checkout/payment/page.tsx`

**Changes**:
1. Update `startOnlinePayment()` function
2. Add conditional logic:
   - If `paymentMethod === 'benefit'`: Call `/api/payments/benefit/init`
   - If `paymentMethod === 'card'`: Call `/api/payments/eazypay/create-invoice` (existing)
   - If `paymentMethod === 'cod'`: Keep existing logic
3. Handle BENEFIT response (redirect URL)
4. Update error messages for BENEFIT gateway

---

### Phase 4: Database Updates

#### Step 9: Order Schema Updates (If Needed)
**Check**: Does orders table need BENEFIT-specific fields?

**Potential fields to add**:
- `benefit_payment_id` (store PaymentID from BENEFIT)
- `benefit_trans_id` (store TransID from response)
- `benefit_ref` (store Ref from response)
- `benefit_auth_resp_code` (store AuthRespCode)

**File**: Create migration if needed: `ADD_BENEFIT_PAYMENT_FIELDS.sql`

---

### Phase 5: Testing & Validation

#### Step 10: Testing Checklist
1. Test init payment route
2. Test encryption/decryption (verify IV, encoding)
3. Test response handler (success case)
4. Test error handler (failure case)
5. Test merchant notification (if enabled)
6. Test complete payment flow end-to-end
7. Verify order status updates correctly
8. Test with test credentials from bank

---

## File Structure Summary

### New Files to Create
```
client/src/lib/services/benefit/
  ├── crypto.ts                    # AES encrypt/decrypt functions
  └── trandata.ts                  # Trandata builder function

client/src/app/api/payments/benefit/
  ├── init/
  │   └── route.ts                 # Init payment endpoint
  └── notify/
      └── route.ts                 # Merchant notification endpoint

client/src/app/pay/benefit/
  ├── response/
  │   └── page.tsx                 # Success response handler
  └── error/
      └── page.tsx                 # Error response handler

ADD_BENEFIT_PAYMENT_FIELDS.sql     # Database migration (if needed)
```

### Files to Modify
```
client/src/app/checkout/payment/page.tsx    # Add BENEFIT gateway routing
client/.env.local                           # Add BENEFIT credentials
```

---

## Critical Implementation Details

### 1. AES Encryption/Decryption
- **IV must be exactly**: `PGKEYENCDECIVSPC` (16 bytes ASCII)
- **Mode**: AES-256-CBC
- **Padding**: PKCS7 (Node.js default)
- **Key**: Resource Key from environment
- **Encoding**: URL encode before encrypt, URL decode after decrypt
- **Output format**: Uppercase hex string

### 2. Trandata Format
- Must be JSON array: `[{ ...fields... }]`
- Field order matters (follow BENEFIT documentation)
- `udf1` must be empty string `""`
- `currencycode = "048"` for BHD
- `action = "1"` for purchase
- `trackId` should be numeric if possible (use order ID)

### 3. URL Requirements
- URLs must be public (no localhost in production)
- Use default ports (80/443)
- URL length ≤ 254 characters
- ResponseURL and ErrorURL must be absolute URLs

### 4. Merchant Notification
- **Critical**: If enabled, must implement notification handler
- Failure to acknowledge may void transaction
- Must respond with correct JSON format
- Should be idempotent (handle duplicates)

### 5. Security Considerations
- Never expose credentials to client
- Validate all responses server-side
- Verify amounts match order
- Verify trackId matches order
- Store transaction IDs for reconciliation

---

## Migration Path

### Step-by-Step Execution Order
1. Create crypto module (Step 2)
2. Create trandata builder (Step 3)
3. Create init route (Step 4)
4. Update payment page to route to BENEFIT (Step 8)
5. Create response handler (Step 5)
6. Create error handler (Step 6)
7. Create notification handler if needed (Step 7)
8. Add database fields if needed (Step 9)
9. Test thoroughly (Step 10)

---

## Testing Strategy

### Unit Tests
- Test encryption/decryption with known values
- Test trandata builder with various inputs
- Test URL encoding/decoding

### Integration Tests
- Test init endpoint with valid order
- Test response handler with mock trandata
- Test error handler with error responses
- Test notification handler (if enabled)

### End-to-End Tests
- Complete payment flow (init → redirect → response)
- Error flow (init → redirect → error)
- Notification flow (if enabled)
- Verify order status updates
- Verify inventory updates correctly

---

## Rollback Plan

If issues arise:
1. Revert payment page changes (route "benefit" back to EazyPay)
2. Keep BENEFIT routes for future use
3. Document issues for fixing
4. Test EazyPay flow still works

---

## Documentation Updates Needed

After implementation:
1. Update payment gateway documentation
2. Add BENEFIT setup guide
3. Document environment variables
4. Create troubleshooting guide
5. Document notification setup (if used)

---

## Next Steps

1. Review this plan
2. Confirm approach (Option 1: Replace vs Option 2: Add)
3. Get BENEFIT credentials from bank
4. Confirm if Merchant Notification is enabled
5. Begin implementation following phases above



