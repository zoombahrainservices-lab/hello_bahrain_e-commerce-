# Profile & Address Management Setup Guide

## 📋 Overview

This guide explains how to set up the profile and address management features.

## 🗄️ Database Setup

### Step 1: Run SQL Schema Updates

You need to add two things to your Supabase database:

1. **Add `phone` column to `users` table**
2. **Create `user_addresses` table**

### Step 2: Execute SQL in Supabase

1. Go to your Supabase project dashboard
2. Click on **SQL Editor**
3. Click **New Query**
4. Copy and paste the contents of `server/src/config/schema-updates.sql`
5. Click **Run** to execute

**OR** manually run these SQL commands:

```sql
-- Add phone number to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- Create user_addresses table
CREATE TABLE IF NOT EXISTS user_addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(50) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  address_line1 VARCHAR(255) NOT NULL,
  address_line2 VARCHAR(255),
  city VARCHAR(100) NOT NULL,
  country VARCHAR(100) NOT NULL,
  postal_code VARCHAR(20) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;

-- Create trigger function
CREATE OR REPLACE FUNCTION update_user_addresses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_user_addresses_updated_at ON user_addresses;
CREATE TRIGGER trigger_update_user_addresses_updated_at
  BEFORE UPDATE ON user_addresses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_addresses_updated_at();
```

## ✅ Features Implemented

### 1. Profile Page (`/profile`)
- **Edit Profile Information:**
  - Name
  - Email
  - Phone Number

- **Manage Addresses:**
  - View all saved addresses
  - Add new addresses (Home, Work, Other)
  - Edit existing addresses
  - Delete addresses
  - Set default address

### 2. Checkout Page (`/checkout`)
- **Saved Addresses:**
  - View all saved addresses
  - Select an address to use
  - See which address is selected
  - Link to manage addresses

- **New Address:**
  - Option to use a different address
  - Add new address during checkout
  - Form validation

### 3. API Endpoints

**Profile:**
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `PUT /api/profile/password` - Change password

**Addresses:**
- `GET /api/profile/addresses` - Get all addresses
- `POST /api/profile/addresses` - Create address
- `PUT /api/profile/addresses/:id` - Update address
- `DELETE /api/profile/addresses/:id` - Delete address

## 🎯 How It Works

### Database Structure

**Users Table:**
- Added `phone` column (VARCHAR(20))

**User Addresses Table:**
- `id` - UUID primary key
- `user_id` - Foreign key to users table
- `label` - Address label (Home, Work, Other)
- Address fields (full_name, address_line1, etc.)
- `is_default` - Boolean flag for default address
- Timestamps (created_at, updated_at)

### Address Management

1. **Creating Address:**
   - User goes to Profile → Saved Addresses
   - Clicks "Add New Address"
   - Fills form and saves
   - Address is stored with `user_id`

2. **Using in Checkout:**
   - Checkout page loads saved addresses
   - User selects an address
   - Form auto-fills with selected address
   - User can also add new address during checkout

3. **Default Address:**
   - One address can be marked as default
   - Default address auto-selects in checkout
   - Setting new default unsets previous default

## 🔗 Navigation

- **Header Menu:** "My Profile" link added
- **Profile Page:** Tabs for Profile Info and Saved Addresses
- **Checkout:** Shows saved addresses with option to add new

## 🚀 Testing

1. **After running SQL updates:**
   - Restart your backend server
   - Go to `/profile` to edit your profile
   - Add some addresses
   - Go to checkout and test address selection

2. **Test Scenarios:**
   - Edit profile (name, email, phone)
   - Add multiple addresses (Home, Work)
   - Set default address
   - Use saved address in checkout
   - Add new address during checkout

## 📝 Notes

- All addresses are linked to users via `user_id`
- Addresses are private to each user
- Default address is automatically selected in checkout
- Phone number is optional in user profile
- Address labels help organize addresses (Home, Work, Other)




