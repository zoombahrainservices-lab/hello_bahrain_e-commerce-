# Banner Edit Process - Complete Flow Explanation

## Overview
This document explains the complete flow of editing a banner, from clicking "Edit" to saving changes.

## Step-by-Step Process

### 1. **User Clicks "Edit" Button** (`page.tsx:140`)
- Function: `handleEdit(banner: Banner)`
- What happens:
  - Logs the banner being edited
  - Sets `editingBanner` state to the selected banner
  - Populates `formData` with all banner properties:
    - Basic: title, subtitle, ctaLabel, ctaLink, image, active
    - Styling: titleColor, titleSize, titleBold, titleItalic
    - Styling: subtitleColor, subtitleSize, subtitleBold, subtitleItalic
    - Button: buttonBgColor, buttonTextColor
    - Alignment: textAlign, textVertical, buttonAlign, buttonVertical
    - Order: displayOrder
  - Sets `showForm(true)` to display the edit form
  - Scrolls to form after 100ms delay

### 2. **User Modifies Banner Properties**
- User can change:
  - **Text**: Title, Subtitle
  - **Colors**: Title color, Subtitle color, Button background, Button text
  - **Sizes**: Title size (sm/md/lg), Subtitle size (sm/md/lg)
  - **Styling**: Bold, Italic for title and subtitle
  - **Alignment**: 
    - Text horizontal (left/center/right)
    - Text vertical (top/middle/bottom)
    - Button horizontal (left/center/right)
    - Button vertical (top/middle/bottom)
  - **Image**: Upload new banner image
  - **Link**: CTA link destination
  - **Order**: Display order number
  - **Status**: Active/Inactive checkbox

### 3. **User Clicks "Update Banner"** (`page.tsx:74`)
- Function: `handleSubmit(e: React.FormEvent)`
- What happens:
  - Prevents default form submission
  - Logs detailed request information:
    - Banner ID
    - Complete form data
    - All form data keys
  - Makes API call: `PUT /api/admin/banners/{id}` with `formData`

### 4. **API Route Receives Request** (`route.ts:9`)
- Function: `PUT(request: NextRequest, { params })`
- Steps:

#### 4.1 Authentication Check (`route.ts:14`)
- Calls `requireAdmin(request)`
- Returns 401 if not authenticated or not admin

#### 4.2 Extract Banner ID (`route.ts:19`)
- Gets `id` from route params
- Validates ID exists, returns 400 if missing

#### 4.3 Parse Request Body (`route.ts:27`)
- Reads JSON body containing all form data

#### 4.4 Fetch Current Banner (`route.ts:30-55`)
- Queries Supabase for existing banner's `cta_link`
- Handles errors gracefully (continues with defaults if fetch fails)
- Returns 404 if banner doesn't exist

#### 4.5 Build Update Data (`route.ts:57-122`)
- **Basic Fields**: title, subtitle, cta_label, active
- **Image Handling**: 
  - If image is provided and is base64, uploads to Supabase Storage
  - If image is already a URL, keeps it as-is
- **Link Extraction**:
  - Uses new `ctaLink` from form if provided
  - Otherwise extracts from existing `cta_link` (removes alignment data)
  - Defaults to '/' if nothing found
- **Alignment Data**:
  - Builds alignment object with all styling/alignment properties
  - Converts all values to proper types (String, Number, Boolean)
  - Stringifies to JSON
  - Combines: `{link}|||{alignmentJson}`
- **Display Order**: Converts to number

#### 4.6 Validate Update Data (`route.ts:129-134`)
- Checks if there's data to update
- Returns 400 if empty

#### 4.7 Update Database (`route.ts:138-143`)
- Executes Supabase update query
- Updates all fields in `updateData`
- Selects updated row

#### 4.8 Handle Update Errors (`route.ts:145-157`)
- Logs detailed error information:
  - Error code
  - Error message
  - Error details
  - Error hint
  - The update data that failed
- Returns appropriate error response

#### 4.9 Build Response (`route.ts:166-210`)
- Extracts alignment data from updated `cta_link`
- Parses JSON alignment data
- Builds response object with all banner properties
- Returns JSON response

### 5. **Frontend Receives Response** (`page.tsx:80`)
- **Success Path**:
  - Logs success message
  - Resets form to defaults
  - Hides form
  - Clears editing state
  - Refreshes banner list
  - Shows success alert

- **Error Path** (`page.tsx:116-137`):
  - Logs error details
  - Extracts error message, details, hint, code
  - Shows user-friendly error alert
  - Logs full error response to console

## Data Flow Diagram

```
User Action
    ↓
handleEdit() → Populate formData → Show form
    ↓
User modifies fields → formData updated
    ↓
handleSubmit() → API PUT request
    ↓
API Route: requireAdmin() → Validate ID → Fetch current → Build updateData
    ↓
Supabase Update → Success/Error
    ↓
Response → Frontend
    ↓
Success: Reset form, refresh list, show alert
Error: Show error message, log details
```

## Key Data Structures

### Form Data Structure
```typescript
{
  title: string
  subtitle: string
  ctaLabel: string
  ctaLink: string
  image: string (base64 or URL)
  active: boolean
  displayOrder: number
  titleColor: string (hex)
  titleSize: 'sm' | 'md' | 'lg'
  titleBold: boolean
  titleItalic: boolean
  subtitleColor: string (hex)
  subtitleSize: 'sm' | 'md' | 'lg'
  subtitleBold: boolean
  subtitleItalic: boolean
  buttonBgColor: string (hex)
  buttonTextColor: string (hex)
  textAlign: 'left' | 'center' | 'right'
  textVertical: 'top' | 'middle' | 'bottom'
  buttonAlign: 'left' | 'center' | 'right'
  buttonVertical: 'top' | 'middle' | 'bottom'
}
```

### Database Storage
- **cta_link**: Stores as `{link}|||{alignmentJson}`
- **display_order**: Separate column
- **image**: URL to Supabase Storage
- All other fields: Direct columns

## Common Issues & Solutions

### Issue 1: 500 Error on Update
**Possible Causes:**
1. Database constraint violation
2. Field too long (cta_link might exceed VARCHAR limit)
3. Invalid data type
4. Missing column

**Debug Steps:**
1. Check browser console for detailed error logs
2. Check server logs for Supabase error details
3. Look for error code, message, details, hint
4. Verify updateData structure matches database schema

### Issue 2: Alignment Not Saving
**Solution:** Check that alignment data is properly stringified and combined with link

### Issue 3: Image Not Updating
**Solution:** Verify image is base64 or URL, and uploadBase64Image handles both

## Debugging Commands

### Check Browser Console
- Look for "=== BANNER UPDATE REQUEST ==="
- Check "Form Data" log
- Check error details in "Error details" log

### Check Server Logs
- Look for "Updating banner with data:"
- Check "Supabase update error:" for database errors
- Check error code, message, details, hint

## Next Steps for Debugging

1. **Try updating a banner** and check:
   - Browser console for request data
   - Server terminal for error details
   - Network tab for response body

2. **Check the error response** - it should now include:
   - Error message
   - Error code
   - Error details (database constraint info)
   - Error hint (suggested fix)

3. **Common fixes based on error:**
   - If "value too long" → cta_link field might need to be TEXT instead of VARCHAR
   - If "column doesn't exist" → Check database schema
   - If "invalid input" → Check data type conversions


