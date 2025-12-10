# Hello One Bahrain - Module Structure

## Overview

This document outlines the modular structure of the Hello One Bahrain digital ecosystem, built on Next.js with Supabase backend.

## Module Architecture

### Current Modules

1. **E-commerce** (`/`)
   - Existing fully functional e-commerce module
   - Products, cart, checkout, orders
   - Admin panel for product management

2. **Business Directory** (`/directory`)
   - Status: Placeholder page created
   - Purpose: Discover and connect with businesses across Bahrain

3. **News & Law Updates** (`/news`)
   - Status: Placeholder page created
   - Purpose: Latest news and legal updates in Bahrain

4. **Events & Networking** (`/events`)
   - Status: Placeholder page created
   - Purpose: Discover and join networking events and conferences

5. **Classifieds** (`/classifieds`)
   - Status: Placeholder page created
   - Purpose: Buy and sell items, find services, post listings

6. **Power Groups** (`/power-groups`)
   - Status: Placeholder page created
   - Purpose: Industry-specific communities and networking

7. **Wallet & Payments** (`/wallet`)
   - Status: Placeholder page created
   - Requires: Authentication
   - Purpose: Digital wallet management with Tap/BenefitPay integration

8. **Referral System** (`/referrals`)
   - Status: Placeholder page created
   - Requires: Premium membership or Admin
   - Purpose: Earn rewards by referring others

9. **Admin Dashboard** (`/admin`)
   - Status: Existing admin panel
   - Requires: Admin role
   - Purpose: Centralized administration for all modules

## Folder Structure

```
/src/app/
├── /                    # Home & E-commerce
├── /directory/          # Business Directory
├── /news/               # News & Law Updates
├── /events/             # Events & Networking
├── /classifieds/         # Classifieds
├── /power-groups/        # Power Groups
├── /wallet/              # Wallet & Payments
├── /referrals/           # Referral System (Premium)
├── /admin/               # Admin Dashboard
└── /api/                 # API Routes (shared)
```

## User Roles

- **public**: Unauthenticated users
- **free**: Free tier authenticated users
- **premium**: Premium tier users (access to referrals)
- **admin**: Administrators (full access)

## Navigation

The global navigation header includes:
- Home
- E-commerce
- Directory
- News
- Events
- Classifieds
- Power Groups

User-specific links (in dropdown):
- My Orders
- Wallet
- Referrals (Premium/Admin only)
- Admin Panel (Admin only)

## Shared Resources

### Types
- `src/lib/types.ts` - Core type definitions including User with role support
- `src/lib/module-types.ts` - Module metadata and access control utilities

### Contexts
- `src/contexts/AuthContext.tsx` - Authentication and user session
- `src/contexts/CartContext.tsx` - Shopping cart state

### Components
- `src/components/Header.tsx` - Global navigation header
- `src/components/Footer.tsx` - Global footer

## Development Guidelines

1. **Module Development**
   - Each module should be self-contained in its own folder
   - Use TypeScript for all new code
   - Follow Next.js App Router conventions

2. **Authentication**
   - Use `useAuth()` hook from `AuthContext` for user data
   - Check user roles using `hasModuleAccess()` from `module-types.ts`

3. **Database**
   - All modules use Supabase as the backend
   - Use serverless API routes in `/api/` for data operations
   - Follow existing patterns for Supabase queries

4. **Styling**
   - Use Tailwind CSS utility classes
   - Ensure responsive design (mobile-first)
   - Follow existing design patterns

5. **API Routes**
   - Place module-specific API routes in `/api/[module-name]/`
   - Use `requireAdmin()` middleware for admin-only routes
   - Return consistent JSON responses

## Next Steps

1. **Database Schema**
   - Create Supabase tables for each module
   - Set up Row Level Security (RLS) policies
   - Create indexes for performance

2. **Module Implementation**
   - Start with Business Directory (most straightforward)
   - Implement News & Law Updates with content management
   - Build Events system with calendar integration
   - Develop Classifieds with image uploads
   - Create Power Groups with community features
   - Integrate Wallet with payment gateways
   - Build Referral system with tracking

3. **Edge Functions**
   - Wallet transaction processing
   - Referral reward calculation
   - Email notifications
   - Payment webhooks

4. **Mobile App**
   - React Native app connecting to same Supabase backend
   - Shared authentication
   - Module-specific screens

## Notes

- All existing e-commerce functionality remains intact
- New modules are built incrementally
- Each module can be developed and deployed independently
- Shared authentication ensures seamless user experience across modules

