'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <Image
              src="/logo.jpg"
              alt="HelloOneBahrain Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-2xl font-bold text-primary-600">HelloOneBahrain</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition">
              Home
            </Link>
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition">
              E-commerce
            </Link>
            <Link href="/directory" className="text-gray-700 hover:text-primary-600 transition">
              Directory
            </Link>
            <Link href="/news" className="text-gray-700 hover:text-primary-600 transition">
              News
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-primary-600 transition">
              Events
            </Link>
            <Link href="/classifieds" className="text-gray-700 hover:text-primary-600 transition">
              Classifieds
            </Link>
            <Link href="/power-groups" className="text-gray-700 hover:text-primary-600 transition">
              Power Groups
            </Link>
            <Link href="/cart" className="relative text-gray-700 hover:text-primary-600 transition">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              {getItemCount() > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span className="hidden lg:inline">{user.name}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <div className="px-4 py-2 border-b">
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                    <Link
                      href="/profile/orders"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      My Orders
                    </Link>
                    <Link
                      href="/wallet"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setShowDropdown(false)}
                    >
                      Wallet
                    </Link>
                    {(user.role === 'premium' || user.role === 'admin') && (
                      <Link
                        href="/referrals"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Referrals
                      </Link>
                    )}
                    {user.role === 'admin' && (
                      <Link
                        href="/admin"
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        onClick={() => setShowDropdown(false)}
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                Login
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        {/* Mobile Navigation */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                E-commerce
              </Link>
              <Link
                href="/directory"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Directory
              </Link>
              <Link
                href="/news"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                News
              </Link>
              <Link
                href="/events"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Events
              </Link>
              <Link
                href="/classifieds"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Classifieds
              </Link>
              <Link
                href="/power-groups"
                className="text-gray-700 hover:text-primary-600"
                onClick={() => setShowMobileMenu(false)}
              >
                Power Groups
              </Link>
              <Link
                href="/cart"
                className="text-gray-700 hover:text-primary-600 flex items-center"
                onClick={() => setShowMobileMenu(false)}
              >
                Cart ({getItemCount()})
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile/orders"
                    className="text-gray-700 hover:text-primary-600"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/wallet"
                    className="text-gray-700 hover:text-primary-600"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Wallet
                  </Link>
                  {(user.role === 'premium' || user.role === 'admin') && (
                    <Link
                      href="/referrals"
                      className="text-gray-700 hover:text-primary-600"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Referrals
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-primary-600"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Admin Panel
                    </Link>
                  )}
                  <button
                    onClick={() => {
                      handleLogout();
                      setShowMobileMenu(false);
                    }}
                    className="text-red-600 hover:text-red-700 text-left"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/auth/login"
                  className="text-primary-600 hover:text-primary-700"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}

