# Banner Alignment - Complete Diagnosis

## ✅ CONFIRMED: The Problem

After running `npm run fix-banner-alignment`, I found:

### Current Database Columns:
- ✅ id
- ✅ title
- ✅ subtitle
- ✅ cta_label
- ✅ cta_link
- ✅ image
- ✅ active
- ✅ created_at
- ✅ updated_at

### MISSING Columns:
- ❌ text_align
- ❌ text_vertical
- ❌ button_align
- ❌ button_vertical
- ❌ display_order

## The Flow (What Happens):

### Step 1: User Changes Alignment Dropdown ✅
- You select "Center" from dropdown
- `handleChange()` fires
- `formData.buttonAlign` changes to "center"
- **Live Preview updates immediately** (because it uses formData)
- **This step WORKS**

### Step 2: User Clicks Save ✅
- Form submits with `formData`
- Frontend sends: `{ buttonAlign: 'center' }`
- **This step WORKS**

### Step 3: Backend Receives Request ✅
- Backend receives: `{ buttonAlign: 'center' }`
- Transforms to: `{ button_align: 'center' }`
- **This step WORKS**

### Step 4: Backend Tries to Update Database ❌
- Backend runs: `UPDATE banners SET button_align = 'center' WHERE id = '...'`
- **Database ERROR**: column "button_align" does not exist
- Backend catches error, retries with basic columns only
- **Changes are NOT saved**

### Step 5: User Edits Again ❌
- Fetches banner from database
- Database returns: no alignment columns (they don't exist)
- Form loads with default values (left, middle)
- **Changes are LOST**

## Why Live Preview Works But Save Doesn't:

- **Live Preview**: Uses React state (formData) - works instantly
- **After Save**: Fetches from database - database doesn't have alignment columns
- **Result**: Changes appear to work but don't persist

## THE FIX (Must Be Done):

You MUST run this SQL in Supabase to add the columns:

```sql
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_align VARCHAR(10) DEFAULT 'left';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_vertical VARCHAR(10) DEFAULT 'middle';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_align VARCHAR(10) DEFAULT 'left';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS button_vertical VARCHAR(10) DEFAULT 'middle';
ALTER TABLE banners ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_banners_display_order ON banners(display_order);
```

### How to Run:
1. Go to: https://supabase.com/dashboard/project/clmhzxiuzqvebzlkbdjs/sql/new
2. Paste the SQL above
3. Click "Run"
4. Restart backend server

### After Running SQL:
- Alignment values will save to database
- When you edit again, values will persist
- Alignment will work properly

