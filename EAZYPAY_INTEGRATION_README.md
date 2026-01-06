# EazyPay Integration Guide

## Overview

This document describes the complete EazyPay integration for HelloOneBahrain e-commerce platform, including both **Checkout API** (customer payments) and **Portal API** (admin operations).

## Architecture

### Tech Stack
- **Framework**: Next.js 14 (Serverless API Routes)
- **Database**: Supabase (PostgreSQL)
- **Language**: TypeScript
- **Payment Gateway**: EazyPay (Checkout + Portal APIs)

### Integration Components

1. **EazyPay Checkout Service** (`client/src/lib/services/eazypayCheckout.ts`)
   - Invoice creation
   - Transaction queries
   - HMAC-SHA256 signature generation

2. **EazyPay Portal Service** (`client/src/lib/services/eazypayPortal.ts`)
   - Transactions, settlements, VAT reports
   - Dispute management
   - Transaction lookups

3. **Payment API Endpoints** (`client/src/app/api/payments/eazypay/`)
   - `/create-invoice` - Create payment invoice
   - `/query` - Query payment status
   - `/webhook` - Payment webhook handler

4. **Admin API Endpoints** (`client/src/app/api/admin/eazypay/`)
   - `/transactions` - Live transactions
   - `/settlements` - Settlement reports
   - `/vat` - VAT reports
   - `/disputes` - Dispute management
   - `/settlements/report` - Download settlement reports
   - `/transaction-details` - Transaction lookup

## Required Environment Variables

Add these to your `.env.local` file (and Vercel environment variables for production):

```env
# EazyPay Checkout API (for customer payments)
EAZYPAY_CHECKOUT_APP_ID=your_checkout_app_id
EAZYPAY_CHECKOUT_SECRET_KEY=your_checkout_secret_key

# EazyPay Portal API (for admin operations)
EAZYPAY_PORTAL_API_KEY=your_portal_api_key
EAZYPAY_PORTAL_SECRET_KEY=your_portal_secret_key

# Base URLs (already configured)
CLIENT_URL=https://helloonebahrain.com
```

## Database Migration

Run the SQL migration to add payment fields to the orders table:

1. Go to Supabase SQL Editor
2. Run `ADD_EAZYPAY_PAYMENT_FIELDS.sql`
3. This adds:
   - `global_transactions_id` - EazyPay transaction ID
   - `payment_method` - Payment method used
   - `paid_on` - Payment completion timestamp
   - `payment_raw_response` - Raw API response JSON
   - `user_token` - EazyPay user token (for returning customers)
   - `dcc_uptake` - Dynamic Currency Conversion status
   - `dcc_receipt_text` - DCC receipt HTML

## API Routes

### Customer Payment Routes

#### POST `/api/payments/eazypay/create-invoice`
Creates an EazyPay invoice and returns payment URL.

**Request:**
```json
{
  "orderId": "order-uuid",
  "amount": "10.500",
  "currency": "BHD",
  "description": "Order #123"
}
```

**Response:**
```json
{
  "paymentUrl": "https://checkout.eazy.net/...",
  "globalTransactionsId": "txn-123",
  "userToken": "token-456"
}
```

#### POST `/api/payments/eazypay/query`
Queries payment status from EazyPay.

**Request:**
```json
{
  "orderId": "order-uuid"
}
```

**Response:**
```json
{
  "isPaid": true,
  "globalTransactionsId": "txn-123",
  "paidOn": "2024-01-01T12:00:00Z",
  "paymentMethod": "card",
  "dccUptake": "ACCEPTED",
  "dccReceiptText": "<html>..."
}
```

#### POST `/api/payments/eazypay/webhook`
Webhook endpoint for EazyPay payment notifications. Verifies HMAC signature and updates order status.

**Headers:**
- `Secret-Hash`: HMAC-SHA256 signature
- `Timestamp`: Request timestamp

**Body:**
```json
{
  "timestamp": "1234567890",
  "nonce": "unique-nonce",
  "globalTransactionsId": "txn-123",
  "isPaid": true
}
```

### Admin Portal Routes

All admin routes require authentication (admin role).

#### GET `/api/admin/eazypay/transactions`
Get live transactions.

**Query Parameters:**
- `page` - Page number (default: 1)
- `size` - Page size (default: 20, max: 50)
- `id` - Transaction ID (optional)
- `terminalId` - Terminal ID (optional)
- `cardNo` - Card number (optional)
- `terminalName` - Terminal name (optional)

#### GET `/api/admin/eazypay/settlements`
Get settlement report.

**Query Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)

#### GET `/api/admin/eazypay/vat`
Get VAT report.

**Query Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)

#### GET `/api/admin/eazypay/disputes`
Get disputes list.

**Query Parameters:**
- `page` - Page number (default: 1)
- `size` - Page size (default: 20)
- `caseId` - Case ID (optional)
- `dateFlag` - 'E' (expiry) or 'D' (date) (optional)
- `dateFrom` - Start date (YYYY-MM-DD, required if dateFlag set)
- `dateTo` - End date (YYYY-MM-DD, required if dateFlag set)

#### POST `/api/admin/eazypay/disputes/create`
Create a new dispute (multipart/form-data).

**Required Fields:**
- `apiKey`
- `submitterName`
- `terminalId`
- `cardNo`
- `transactionDate`
- `transactionAmount`
- `claimAmount`
- `msg`
- `rrn`, `arn`, `authCode` (optional)
- `scheme`, `schemeConditionId` (optional)
- `file` - Document file (optional)

#### POST `/api/admin/eazypay/disputes/reply`
Reply to a dispute (multipart/form-data).

**Required Fields:**
- `apiKey`
- `caseId`
- `msg`
- `file` - Document file (optional)

#### GET `/api/admin/eazypay/settlements/report`
Get settlement report download link (PDF/CSV).

**Query Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)
- `storePublicId` - Store public ID
- `reportFileType` - 'pdf' or 'csv'

#### GET `/api/admin/eazypay/transaction-details`
Find transaction by RRN and Auth Code.

**Query Parameters:**
- `rrn` - Retrieval Reference Number
- `authCode` - Authorization Code
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)

## Payment Flow

### Customer Checkout Flow

1. **Customer selects payment method** (Card/BenefitPay) on `/checkout/payment`
2. **Order is created** with `payment_status: 'unpaid'`
3. **Invoice is created** via `/api/payments/eazypay/create-invoice`
4. **Customer is redirected** to EazyPay payment page
5. **After payment**, customer is redirected to `/pay/complete?orderId=...`
6. **Payment status is queried** from EazyPay and order is updated
7. **Customer sees success/failure** message

### Webhook Flow

1. **EazyPay sends webhook** to `/api/payments/eazypay/webhook`
2. **Signature is verified** using HMAC-SHA256
3. **Order is updated** idempotently (only if not already paid)
4. **Response 200** is returned to acknowledge receipt

## HMAC Signature Verification

### Checkout API Signatures

**Create Invoice:**
```
HMAC-SHA256(secret, timestamp + currency + amount + appId)
```

**Query Transaction:**
```
HMAC-SHA256(secret, timestamp + appId)
```

**Webhook:**
```
HMAC-SHA256(secret, timestamp + nonce + globalTransactionsId + isPaid)
```

### Portal API Signatures

**All Portal APIs:**
```
HMAC-SHA256(secret, timestamp + exact_json_string)
```

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **All API calls are server-to-server** only
3. **Webhook signatures are verified** before processing
4. **Idempotent updates** prevent duplicate processing
5. **Input validation** on all endpoints
6. **Error messages** don't leak sensitive information in production

## Testing

### Local Testing Steps

1. **Set up environment variables** in `client/.env.local`
2. **Run database migration** in Supabase SQL Editor
3. **Start dev server**: `npm run dev` (in `client/` directory)
4. **Test checkout flow**:
   - Add items to cart
   - Go to checkout
   - Select payment method
   - Complete test payment
5. **Test webhook** (use EazyPay test webhook or simulate):
   ```bash
   curl -X POST http://localhost:3000/api/payments/eazypay/webhook \
     -H "Content-Type: application/json" \
     -H "Secret-Hash: <computed-hash>" \
     -d '{"timestamp":"...","nonce":"...","globalTransactionsId":"...","isPaid":true}'
   ```
6. **Test admin endpoints** (requires admin authentication):
   - Use admin credentials to get JWT token
   - Call admin endpoints with `Authorization: Bearer <token>`

### UAT Checklist

- [ ] Environment variables configured in Vercel
- [ ] Database migration applied
- [ ] Test payment flow end-to-end
- [ ] Verify webhook receives and processes payments
- [ ] Test payment query endpoint
- [ ] Test all admin portal endpoints
- [ ] Verify DCC receipt text is sanitized and displayed correctly
- [ ] Test dispute creation and replies
- [ ] Verify settlement report downloads
- [ ] Check error handling and logging
- [ ] Verify idempotent webhook processing
- [ ] Test with different payment methods (Card, BenefitPay)
- [ ] Verify order status updates correctly
- [ ] Check payment_raw_response is stored correctly

## Deployment Notes

1. **Add environment variables** to Vercel:
   - Go to Project Settings → Environment Variables
   - Add all required EazyPay variables
   - Set for Production, Preview, and Development environments

2. **Configure webhook URL** in EazyPay dashboard:
   - Webhook URL: `https://helloonebahrain.com/api/payments/eazypay/webhook`
   - Ensure webhook is enabled for your merchant account

3. **Run database migration** in Supabase production database

4. **Test in production** before going live:
   - Use test mode if available
   - Verify webhook connectivity
   - Test a small transaction first

## Troubleshooting

### Payment Not Processing
- Check environment variables are set correctly
- Verify HMAC signature computation
- Check EazyPay API logs
- Verify order exists and has correct status

### Webhook Not Receiving
- Check webhook URL is configured in EazyPay dashboard
- Verify webhook endpoint is accessible (not blocked by firewall)
- Check signature verification logic
- Review server logs for errors

### Admin Endpoints Returning 403
- Verify user has admin role
- Check JWT token is valid
- Ensure `requireAdmin` middleware is working

## Support

For EazyPay API issues:
- Contact Eazy Financial Services support
- Review EazyPay API documentation
- Check EazyPay merchant portal

For integration issues:
- Review server logs
- Check database for order/payment records
- Verify environment variables
- Test HMAC signature generation





