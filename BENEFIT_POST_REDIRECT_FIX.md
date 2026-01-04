# BENEFIT Payment Gateway POST Redirect Issue

## The Problem

BENEFIT payment gateway redirects back using **POST method**, but Next.js pages only handle **GET requests**. This causes:

- ❌ POST `/pay/benefit/error` → 500 Error (Invalid URL)
- ✅ GET `/pay/benefit/error` → 200 OK (works fine)

## The Solution

BENEFIT gateway redirects with POST data (encrypted `trandata`). We need to:

1. **Create API route handlers** that accept POST requests from BENEFIT
2. **Process the POST data** (decrypt trandata, etc.)
3. **Redirect (GET) to the pages** with query parameters

## Current Status

✅ We already have API routes:
- `/api/payments/benefit/process-response` - Handles POST from BENEFIT success
- `/api/payments/benefit/process-error` - Handles POST from BENEFIT error

But these routes return JSON, they don't redirect to pages.

## What Needs to Change

Instead of redirecting directly to pages, BENEFIT should redirect to:
- **Success**: `/api/payments/benefit/callback?orderId=...` (POST)
- **Error**: `/api/payments/benefit/callback-error?orderId=...` (POST)

These API routes will:
1. Accept POST from BENEFIT
2. Process the data
3. Redirect (GET) to the pages: `/pay/benefit/response` or `/pay/benefit/error`

## Next Steps

1. Update `errorURL` and `responseURL` in `/api/payments/benefit/init/route.ts` to point to API routes
2. Create/update callback API routes that redirect to pages
3. Test the flow

