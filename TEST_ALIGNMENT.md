# Testing Alignment Changes

## Step 1: Check if formData updates
Open browser console and change Button Horizontal to CENTER.
You should see: `🔄 Form field changed: { name: 'buttonAlign', value: 'center' }`

## Step 2: Check if preview updates
The preview should immediately show the button centered.

## Step 3: Check if it saves
Click Save and check console for:
- `📤 Submitting banner with formData`
- `🎯 Alignment values being submitted: { buttonAlign: 'center' }`

## Step 4: Check backend
Backend console should show:
- `🔄 Updating banner with data`
- `🎯 Alignment values being sent: { button_align: 'center' }`

## Step 5: Check database response
Backend console should show:
- `💾 Database values after update: { button_align: 'center' }`

## If preview doesn't update immediately:
The CSS is not working. Check BannerPreview component.

## If preview updates but doesn't save:
The database columns don't exist. Run the SQL from BANNER_COLUMNS_FIX.md




