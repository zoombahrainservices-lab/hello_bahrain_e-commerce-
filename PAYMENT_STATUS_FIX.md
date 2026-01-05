# Fix Payment Status Constraint Error

## The Error

```
new row for relation "orders" violates check constraint "orders_payment_status_check"
```

## Root Cause

The `payment_status` column has a CHECK constraint that only allows `'unpaid'` and `'paid'`, but the code is trying to set it to `'failed'`.

## Solution

Run the SQL migration to update the CHECK constraint to allow `'failed'` status.

### Step 1: Run SQL Migration

Go to Supabase SQL Editor and run:

**File**: `FIX_PAYMENT_STATUS_CONSTRAINT.sql`

Or copy this SQL:

```sql
-- Drop the existing constraint
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

-- Add new constraint that allows 'unpaid', 'paid', and 'failed'
ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('unpaid', 'paid', 'failed'));
```

### Step 2: Verify

After running, the constraint will allow:
- ✅ `'unpaid'`
- ✅ `'paid'`
- ✅ `'failed'` (new)

### Alternative: Updated Migration File

The `RUN_BENEFIT_MIGRATION.sql` file has also been updated to include this fix, so if you haven't run the migration yet, run the updated version.

## Temporary Workaround

If you can't run the SQL migration right away, the code has been updated to use `'unpaid'` instead of `'failed'` as a temporary workaround. However, it's better to run the SQL migration to properly support the `'failed'` status.

## Files Changed

1. ✅ `FIX_PAYMENT_STATUS_CONSTRAINT.sql` - New SQL file to fix constraint
2. ✅ `RUN_BENEFIT_MIGRATION.sql` - Updated to include constraint fix
3. ✅ `client/src/app/api/payments/benefit/mark-failed/route.ts` - Temporary workaround (uses 'unpaid')

## Next Steps

1. Run the SQL migration in Supabase
2. The error page will work correctly
3. Orders can be marked as 'failed' when payment fails

---

**Status**: Error page is working ✅, but database constraint needs to be updated to allow 'failed' status.


