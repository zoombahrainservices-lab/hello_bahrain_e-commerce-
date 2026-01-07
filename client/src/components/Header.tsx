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
  const [showEcommerceDropdown, setShowEcommerceDropdown] = useState(false);
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState('');

  const handleLogout = async () => {
    await logout();
    setShowDropdown(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      window.location.href = `/?search=${encodeURIComponent(searchInput.trim())}`;
    }
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50 w-full">
      {/* Top Section - Full Width */}
      <div className="w-full px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 relative">
          {/* Left Side - Search and Currency */}
          <div className="flex items-center space-x-3 flex-1">
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="flex items-center">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-32 sm:w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-700 hover:text-primary-600 transition"
                  aria-label="Search"
                >
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
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </button>
              </div>
            </form>

            {/* Currency Selector */}
            <div className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg bg-white">
              <Image
                src="https://flagcdn.com/w20/bh.png"
                alt="Bahrain Flag"
                width={20}
                height={15}
                className="object-contain"
              />
              <span className="text-sm font-semibold text-gray-700">BHD</span>
            </div>
          </div>

          {/* Center - Logo and Brand Name (Absolutely Centered) */}
          <Link
            href="/"
            className="absolute left-1/2 transform -translate-x-1/2 flex items-center space-x-3"
          >
            <Image
              src="/logo.jpg"
              alt="HelloOneBahrain Logo"
              width={60}
              height={60}
              className="object-contain"
              priority={true}
              onError={(e) => {
                // Fallback: hide image and show text only if image fails to load
                console.warn('Logo image failed to load, using text fallback');
                const target = e.target as HTMLImageElement;
                if (target) {
                  target.style.display = 'none';
                }
              }}
              unoptimized={false}
            />
            <span className="text-3xl font-bold text-primary-600">
              HelloOneBahrain
            </span>
          </Link>

          {/* Right Side - Social Media, Cart, Account */}
          <div className="flex items-center space-x-3 flex-1 justify-end">
            {/* Social Media Icons */}
            <div className="hidden md:flex items-center space-x-3">
              <a
                href="https://www.facebook.com/ZoomConsultancyBH"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-primary-600 hover:text-primary-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/hello__bahrain?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-primary-600 hover:text-primary-700 transition"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              </a>
            </div>

            {/* Cart Icon */}
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
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
                  {getItemCount()}
                </span>
              )}
            </Link>

            {/* Account Icon */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="text-gray-700 hover:text-primary-600 transition"
                  aria-label="Account menu"
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
                className="text-gray-700 hover:text-primary-600 transition"
                aria-label="Login"
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
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden text-gray-700"
              aria-label="Menu"
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
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <div className="w-full border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center justify-center space-x-6 py-3 overflow-x-auto">
            <Link href="/" className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition whitespace-nowrap">
              Home
            </Link>
            <div className="relative">
              <button
                onClick={() => setShowEcommerceDropdown(!showEcommerceDropdown)}
                className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition flex items-center space-x-1 whitespace-nowrap"
              >
                <span>E-commerce</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showEcommerceDropdown ? 'rotate-180' : ''}`}
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
              {showEcommerceDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <Link
                    href="/?category=All"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowEcommerceDropdown(false)}
                  >
                    All Products
                  </Link>
                  <Link
                    href="/?category=T-Shirts"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowEcommerceDropdown(false)}
                  >
                    T-Shirts
                  </Link>
                  <Link
                    href="/?category=Hoodies"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowEcommerceDropdown(false)}
                  >
                    Hoodies
                  </Link>
                  <Link
                    href="/?category=Bags"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowEcommerceDropdown(false)}
                  >
                    Bags
                  </Link>
                  <Link
                    href="/?category=Accessories"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowEcommerceDropdown(false)}
                  >
                    Accessories
                  </Link>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowDirectoryDropdown(!showDirectoryDropdown)}
                className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition flex items-center space-x-1 whitespace-nowrap"
              >
                <span>Directory</span>
                <svg
                  className={`w-4 h-4 transition-transform ${showDirectoryDropdown ? 'rotate-180' : ''}`}
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
              {showDirectoryDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                  <Link
                    href="/directory"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowDirectoryDropdown(false)}
                  >
                    Browse Directory
                  </Link>
                </div>
              )}
            </div>
            <Link href="/news" className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition whitespace-nowrap">
              News
            </Link>
            <Link href="/events" className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition whitespace-nowrap">
              Events
            </Link>
            <Link href="/classifieds" className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition whitespace-nowrap">
              Classifieds
            </Link>
            <Link href="/power-groups" className="text-sm font-semibold text-gray-900 hover:text-primary-600 transition whitespace-nowrap">
              Power Groups
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="flex gap-2">
              <input
                type="text"
                placeholder="Search..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-semibold"
              >
                Search
              </button>
            </form>
            <nav className="flex flex-col space-y-4">
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Home
              </Link>
              <Link
                href="/?category=All"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                E-commerce
              </Link>
              <Link
                href="/directory"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Directory
              </Link>
              <Link
                href="/news"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                News
              </Link>
              <Link
                href="/events"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Events
              </Link>
              <Link
                href="/classifieds"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Classifieds
              </Link>
              <Link
                href="/power-groups"
                className="text-gray-700 hover:text-primary-600 transition"
                onClick={() => setShowMobileMenu(false)}
              >
                Power Groups
              </Link>
              <Link
                href="/cart"
                className="text-gray-700 hover:text-primary-600 transition flex items-center"
                onClick={() => setShowMobileMenu(false)}
              >
                Cart ({getItemCount()})
              </Link>
              {user ? (
                <>
                  <Link
                    href="/profile/orders"
                    className="text-gray-700 hover:text-primary-600 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    My Orders
                  </Link>
                  <Link
                    href="/wallet"
                    className="text-gray-700 hover:text-primary-600 transition"
                    onClick={() => setShowMobileMenu(false)}
                  >
                    Wallet
                  </Link>
                  {(user.role === 'premium' || user.role === 'admin') && (
                    <Link
                      href="/referrals"
                      className="text-gray-700 hover:text-primary-600 transition"
                      onClick={() => setShowMobileMenu(false)}
                    >
                      Referrals
                    </Link>
                  )}
                  {user.role === 'admin' && (
                    <Link
                      href="/admin"
                      className="text-gray-700 hover:text-primary-600 transition"
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
                  className="text-primary-600 hover:text-primary-700 transition"
                  onClick={() => setShowMobileMenu(false)}
                >
                  Login
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
