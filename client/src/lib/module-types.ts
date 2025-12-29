/**
 * Shared types and interfaces for Hello One Bahrain modules
 */

export type UserRole = 'public' | 'free' | 'premium' | 'admin';

export interface ModuleMetadata {
  name: string;
  path: string;
  description: string;
  icon?: string;
  requiresAuth?: boolean;
  requiredRole?: UserRole[];
  isPremium?: boolean;
}

/**
 * Module definitions for navigation and access control
 */
export const MODULES: Record<string, ModuleMetadata> = {
  home: {
    name: 'Home',
    path: '/',
    description: 'Home page',
  },
  ecommerce: {
    name: 'E-commerce',
    path: '/',
    description: 'Shop premium merchandise',
  },
  directory: {
    name: 'Business Directory',
    path: '/directory',
    description: 'Discover and connect with businesses across Bahrain',
  },
  news: {
    name: 'News & Law Updates',
    path: '/news',
    description: 'Stay informed with the latest news and legal updates',
  },
  events: {
    name: 'Events & Networking',
    path: '/events',
    description: 'Discover and join networking events and conferences',
  },
  classifieds: {
    name: 'Classifieds',
    path: '/classifieds',
    description: 'Buy and sell items, find services, and post listings',
  },
  powerGroups: {
    name: 'Power Groups',
    path: '/power-groups',
    description: 'Join industry-specific communities and power groups',
  },
  wallet: {
    name: 'Wallet & Payments',
    path: '/wallet',
    description: 'Manage your digital wallet and payments',
    requiresAuth: true,
  },
  referrals: {
    name: 'Referral System',
    path: '/referrals',
    description: 'Earn rewards by referring others',
    requiresAuth: true,
    requiredRole: ['premium', 'admin'],
    isPremium: true,
  },
  admin: {
    name: 'Admin Dashboard',
    path: '/admin',
    description: 'Centralized admin dashboard',
    requiresAuth: true,
    requiredRole: ['admin'],
  },
};

/**
 * Check if user has access to a module
 */
export function hasModuleAccess(
  userRole: UserRole | null,
  module: ModuleMetadata
): boolean {
  if (!module.requiresAuth) {
    return true;
  }

  if (!userRole) {
    return false;
  }

  if (module.requiredRole) {
    return module.requiredRole.includes(userRole);
  }

  return true;
}

/**
 * Get navigation items for the current user
 */
export function getNavigationItems(userRole: UserRole | null) {
  return Object.values(MODULES).filter((module) => {
    // Always show home and ecommerce
    if (module.path === '/') {
      return true;
    }
    // Filter based on access
    return hasModuleAccess(userRole, module);
  });
}

