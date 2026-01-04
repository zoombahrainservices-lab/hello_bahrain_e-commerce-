# EazyPay Portal API - UAT Test Checklist

## Pre-Testing Requirements

- [ ] EazyPay Portal credentials obtained and configured
- [ ] Environment variables set in `.env.local`:
  - `EAZYPAY_PORTAL_API_KEY`
  - `EAZYPAY_PORTAL_SECRET_KEY`
- [ ] Admin user account ready
- [ ] Development server running (`npm run dev`)

---

## Test 1: Live Transactions

### Test 1.1: Basic Transaction List
- [ ] Navigate to `/admin/eazypay/transactions`
- [ ] Page loads without errors
- [ ] Transactions table displays
- [ ] Default shows page 1, size 20
- [ ] Transaction data displays correctly (ID, type, time, amount, card, RRN, auth code, status)

### Test 1.2: Filtering
- [ ] Filter by Transaction ID - results show matching transaction
- [ ] Filter by Terminal ID - results show matching transactions
- [ ] Filter by Card Number - results show matching transactions
- [ ] Filter by Terminal Name - results show matching transactions
- [ ] Clear filters - shows all transactions again

### Test 1.3: Pagination
- [ ] Click "Next" - moves to page 2
- [ ] Click "Previous" - moves back to page 1
- [ ] Change page size to 50 - shows up to 50 transactions
- [ ] Try page size > 50 - shows validation error

### Test 1.4: Data Display
- [ ] Card numbers are masked (shows ******)
- [ ] Amounts display with currency
- [ ] Dates/times display in readable format
- [ ] Status codes show correct colors (green for success, red for failure)

---

## Test 2: Settlement Reports

### Test 2.1: Basic Settlement Report
- [ ] Navigate to `/admin/eazypay/settlements`
- [ ] Date range inputs display
- [ ] Select "From" date (YYYY-MM-DD format)
- [ ] Select "To" date (YYYY-MM-DD format)
- [ ] Click "Fetch Report"
- [ ] Settlement data displays

### Test 2.2: Settlement Data Display
- [ ] Summary table shows:
  - Merchant Public ID
  - Store Public ID
  - Total Count
  - Amount
  - Eazy Fee
  - VAT
  - Amount to Pay
- [ ] Totals section displays correctly
- [ ] All amounts formatted properly

### Test 2.3: Validation
- [ ] Try to fetch without dates - shows error
- [ ] Try invalid date format - shows validation error
- [ ] Try "To" date before "From" date - handled gracefully

---

## Test 3: VAT Reports

### Test 3.1: Basic VAT Report
- [ ] Navigate to `/admin/eazypay/vat`
- [ ] Select date range
- [ ] Fetch VAT report
- [ ] VAT data displays

### Test 3.2: VAT Data Display
- [ ] Summary shows:
  - Transaction Amount
  - Commission (exc VAT)
  - VAT Amount
  - Commission (inc VAT)
- [ ] All amounts formatted correctly

---

## Test 4: Disputes Management

### Test 4.1: Disputes List
- [ ] Navigate to `/admin/eazypay/disputes`
- [ ] Disputes list displays
- [ ] Default pagination works

### Test 4.2: Dispute Filtering
- [ ] Filter by Case ID - shows matching dispute
- [ ] Filter by Date Flag (Expiry) with date range
- [ ] Filter by Date Flag (Case Date) with date range
- [ ] Clear filters

### Test 4.3: View Dispute Details
- [ ] Click on a dispute
- [ ] Dispute details show:
  - Case information
  - Transaction details
  - Replies/thread
  - Documents
- [ ] All data displays correctly

### Test 4.4: Create Dispute
- [ ] Click "Create Dispute"
- [ ] Form displays with all required fields:
  - Submitter Name
  - Terminal ID
  - Card Number (format: first 6 + XXXXXX + last 4)
  - Transaction Date
  - Transaction Amount
  - Transaction Currency
  - Claim Amount
  - Claim Currency
  - Message
  - Scheme dropdown (visa/mastercard/other)
  - Scheme Condition dropdown (populated based on scheme)
  - Case Type (C/F/R)
  - Optional: RRN, ARN, Auth Code
  - Optional: File upload
- [ ] Fill all required fields
- [ ] Select scheme - condition dropdown updates
- [ ] Upload file (optional)
- [ ] Submit dispute
- [ ] Success message displays
- [ ] Dispute appears in list

### Test 4.5: Reply to Dispute
- [ ] Select a dispute
- [ ] Click "Reply"
- [ ] Form displays:
  - Case ID (pre-filled)
  - Message (required)
  - Optional file upload
- [ ] Enter message
- [ ] Upload file (optional)
- [ ] Submit reply
- [ ] Success message displays
- [ ] Reply appears in dispute thread

---

## Test 5: Settlement Report Download

### Test 5.1: Generate Report
- [ ] Navigate to `/admin/eazypay/settlement-report`
- [ ] Form displays:
  - From date
  - To date
  - Store Public ID input
  - File type selector (PDF/CSV)
- [ ] Fill all fields
- [ ] Select PDF format
- [ ] Click "Generate Report"
- [ ] Download URL/link displays

### Test 5.2: Download Report
- [ ] Click download link
- [ ] PDF file downloads
- [ ] File opens correctly
- [ ] Repeat with CSV format
- [ ] CSV file downloads and opens correctly

### Test 5.3: Validation
- [ ] Try without Store Public ID - shows error
- [ ] Try invalid date format - shows error
- [ ] Try invalid file type - shows error

---

## Test 6: Transaction Lookup

### Test 6.1: Basic Lookup
- [ ] Navigate to `/admin/eazypay/transaction-lookup`
- [ ] Form displays:
  - RRN input
  - Auth Code input
  - From date
  - To date
- [ ] Fill all fields with valid data
- [ ] Click "Search"
- [ ] Transaction details display

### Test 6.2: Transaction Details Display
- [ ] Shows:
  - Transaction Description
  - Auth Code
  - Amount
  - Transaction Date/Time
  - Total Fee
  - Card Number (masked)
  - Store Name
  - Merchant ID
  - RRN
  - VAT
  - Amount to Pay

### Test 6.3: Validation
- [ ] Try without RRN - shows error
- [ ] Try without Auth Code - shows error
- [ ] Try without dates - shows error
- [ ] Try invalid date format - shows error
- [ ] Try with non-existent RRN/Auth Code - shows "not found" message

---

## Test 7: Error Handling

### Test 7.1: Authentication Errors
- [ ] Logout
- [ ] Try to access `/admin/eazypay/transactions`
- [ ] Redirected to login or shows 401/403

### Test 7.2: API Errors
- [ ] Temporarily set invalid API key
- [ ] Try to fetch transactions
- [ ] Error message displays (no sensitive data)
- [ ] Restore valid credentials

### Test 7.3: Network Errors
- [ ] Disconnect internet
- [ ] Try to fetch data
- [ ] Error message displays gracefully
- [ ] Reconnect and retry - works again

### Test 7.4: Validation Errors
- [ ] Try invalid date formats
- [ ] Try size > 50
- [ ] Try missing required fields
- [ ] All show appropriate validation errors

---

## Test 8: Security

### Test 8.1: RBAC
- [ ] Login as regular user (not admin)
- [ ] Try to access `/admin/eazypay/*`
- [ ] Access denied (403)

### Test 8.2: Secret Key Protection
- [ ] Inspect browser source code
- [ ] Verify no `EAZYPAY_PORTAL_SECRET_KEY` in frontend
- [ ] Verify no API keys exposed

### Test 8.3: Data Masking
- [ ] Check transaction list
- [ ] Card numbers are masked (not full numbers)
- [ ] No sensitive data in console logs

---

## Test 9: Performance

### Test 9.1: Loading States
- [ ] All pages show loading indicators
- [ ] Loading states clear when data arrives
- [ ] No flickering or layout shifts

### Test 9.2: Response Times
- [ ] Transactions load within 3 seconds
- [ ] Reports generate within 5 seconds
- [ ] File downloads start promptly

---

## Test 10: Integration

### Test 10.1: End-to-End Flow
1. [ ] View transactions
2. [ ] Find a transaction with issue
3. [ ] Create dispute for that transaction
4. [ ] View dispute in disputes list
5. [ ] Reply to dispute
6. [ ] Verify dispute status updates

### Test 10.2: Cross-Page Navigation
- [ ] Navigate between all EazyPay pages
- [ ] Navigation works smoothly
- [ ] No data loss when switching pages
- [ ] Back button works correctly

---

## Final Verification

- [ ] All tests pass
- [ ] No console errors
- [ ] No network errors (except intentional tests)
- [ ] All data displays correctly
- [ ] All validations work
- [ ] Security measures in place
- [ ] Performance acceptable
- [ ] User experience smooth

---

## Sign-off

**Tester Name:** _________________

**Date:** _________________

**Status:** ☐ Pass  ☐ Fail  ☐ Partial

**Notes:**
_________________________________________________
_________________________________________________
_________________________________________________

