# How to Run the BENEFIT Database Migration

## ✅ Correct Way to Run SQL Migration

The error you got was because you tried to run a **markdown file** (`.md`) as SQL. Here's how to run it correctly:

### Step 1: Open Supabase SQL Editor

1. Go to https://app.supabase.com
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Copy the SQL Code

**File to use**: `RUN_BENEFIT_MIGRATION.sql` (this is the clean SQL file)

Copy the **entire contents** of `RUN_BENEFIT_MIGRATION.sql` (NOT the markdown file)

### Step 3: Paste into SQL Editor

1. Paste the SQL code into the SQL Editor
2. Click **Run** or press `Ctrl+Enter`

### Step 4: Verify Success

You should see:
- ✅ Success message
- ✅ No errors
- ✅ Confirmation that columns/indexes were created

---

## ⚠️ What NOT to Do

❌ **Don't run**: `BENEFIT_ENV_SETUP.md` (this is a markdown file, not SQL)
❌ **Don't run**: Any file with `.md` extension in SQL Editor
✅ **Do run**: `RUN_BENEFIT_MIGRATION.sql` or `ADD_BENEFIT_PAYMENT_FIELDS.sql`

---

## 📋 SQL Code to Copy

If you can't find the file, here's the SQL code to paste directly:

```sql
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS benefit_payment_id TEXT,
ADD COLUMN IF NOT EXISTS benefit_trans_id TEXT,
ADD COLUMN IF NOT EXISTS benefit_ref TEXT,
ADD COLUMN IF NOT EXISTS benefit_auth_resp_code TEXT;

COMMENT ON COLUMN orders.benefit_payment_id IS 'BENEFIT Payment ID from gateway';
COMMENT ON COLUMN orders.benefit_trans_id IS 'BENEFIT Transaction ID from response';
COMMENT ON COLUMN orders.benefit_ref IS 'BENEFIT Reference number from response';
COMMENT ON COLUMN orders.benefit_auth_resp_code IS 'BENEFIT Authorization response code (00 = approved)';

CREATE INDEX IF NOT EXISTS idx_orders_benefit_payment_id ON orders(benefit_payment_id) WHERE benefit_payment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_orders_benefit_trans_id ON orders(benefit_trans_id) WHERE benefit_trans_id IS NOT NULL;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'payment_status_enum'
        AND e.enumlabel = 'failed'
    ) THEN
        ALTER TYPE payment_status_enum ADD VALUE 'failed';
    END IF;
END $$;
```

---

## ✅ After Running the Migration

1. The migration adds 4 new columns to the `orders` table
2. Creates 2 indexes for faster lookups
3. Adds 'failed' to the payment_status enum

You can verify by running:
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name LIKE 'benefit_%';
```

You should see:
- `benefit_payment_id`
- `benefit_trans_id`
- `benefit_ref`
- `benefit_auth_resp_code`

---

## 🆘 Still Having Issues?

1. Make sure you're in the **SQL Editor** (not Table Editor)
2. Make sure you're copying the **SQL code** (not markdown formatting)
3. Remove any comments that start with `--` if they cause issues
4. Run the SQL statements one by one if needed



