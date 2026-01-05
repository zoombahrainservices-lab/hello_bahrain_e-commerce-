# Quick Fix: Payment Status Constraint Error

## The Error

```
new row for relation "orders" violates check constraint "orders_payment_status_check"
```

## Why It's Happening

The database has a CHECK constraint that only allows:
- ✅ `'unpaid'`
- ✅ `'paid'`
- ❌ `'failed'` (NOT allowed)

But the code is trying to set `payment_status = 'failed'`.

## Solution: Run SQL Migration

**You MUST run this SQL in Supabase to fix it:**

### Step 1: Open Supabase SQL Editor

1. Go to: https://app.supabase.com
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**

### Step 2: Copy This SQL

```sql
ALTER TABLE orders 
DROP CONSTRAINT IF EXISTS orders_payment_status_check;

ALTER TABLE orders
ADD CONSTRAINT orders_payment_status_check 
CHECK (payment_status IN ('unpaid', 'paid', 'failed'));
```

### Step 3: Run It

1. Paste the SQL into the editor
2. Click **Run** button (or press `Ctrl+Enter`)
3. You should see "Success" message

### Step 4: Restart Server

```bash
# Stop server (Ctrl+C in terminal)
cd client
npm run dev
```

## After Fixing

You should see in logs:
```
POST /api/payments/benefit/mark-failed 200 ✅
```

Instead of:
```
POST /api/payments/benefit/mark-failed 500 ❌
```

## Why Two Solutions?

1. **Code was updated** to use `'unpaid'` as fallback (but requires server restart)
2. **SQL migration** properly allows `'failed'` status (RECOMMENDED)

**Run the SQL migration - it's the proper fix!**

## Files

- SQL Fix: `FIX_PAYMENT_STATUS_CONSTRAINT.sql`
- Or use: `RUN_BENEFIT_MIGRATION.sql` (includes this fix)

---

**This is a database constraint issue. Run the SQL and restart the server!**


