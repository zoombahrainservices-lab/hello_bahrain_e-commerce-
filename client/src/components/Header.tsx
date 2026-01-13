'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { user, logout } = useAuth();
  const { getItemCount } = useCart();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showEcommerceDropdown, setShowEcommerceDropdown] = useState(false);
  const [showDirectoryDropdown, setShowDirectoryDropdown] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [hoveredEcommerceItem, setHoveredEcommerceItem] = useState<string | null>(null);
  const [hoveredDirectoryItem, setHoveredDirectoryItem] = useState<string | null>(null);
  const ecommerceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const directoryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (ecommerceTimeoutRef.current) clearTimeout(ecommerceTimeoutRef.current);
      if (directoryTimeoutRef.current) clearTimeout(directoryTimeoutRef.current);
    };
  }, []);

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
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-red-600 hover:text-red-700 transition"
                  aria-label="Search"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
              </div>
            </form>
            {/* Currency Selector */}
            <div className="flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <Image
                src="https://flagcdn.com/w20/bh.png"
                alt="Bahrain Flag"
                width={20}
                height={15}
                className="object-contain"
              />
              <span className="text-sm font-medium text-gray-700">BHD</span>
            </div>
          </div>

          {/* Center - Logo */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center space-x-2">
            <Image
              src="/logo.jpg"
              alt="HelloOneBahrain Logo"
              width={40}
              height={40}
              className="object-contain"
            />
            <span className="text-2xl font-bold text-primary-600">HelloOneBahrain</span>
          </Link>

          {/* Right Side - Social Media, Cart, User */}
          <div className="flex items-center gap-4 flex-1 justify-end">
            {/* Social Media Icons */}
            <div className="hidden md:flex items-center gap-4">
              <a
                href="https://www.facebook.com/ZoomConsultancyBH"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-red-600 hover:text-red-700 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
              <a
                href="https://www.instagram.com/hello__bahrain?utm_source=ig_web_button_share_sheet&igsh=ZDNlZDc0MzIxNw=="
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-red-600 hover:text-red-700 transition"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
                </svg>
              </a>
            </div>

            {/* Cart Icon */}
            <Link href="/cart" className="relative text-red-600 hover:text-red-700 transition">
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

            {/* User Profile Icon */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center text-red-600 hover:text-red-700 transition"
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
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50 border">
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
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm font-medium"
              >
                Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden text-red-600 hover:text-red-700 ml-2 transition"
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

        {/* Bottom Section - Navigation Menu */}
        <div className="hidden lg:block border-t border-gray-200">
          <nav className="flex items-center justify-center space-x-6 h-12">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition text-sm font-medium">
              Home
            </Link>
            <div 
              className="relative group"
              onMouseEnter={() => {
                if (ecommerceTimeoutRef.current) {
                  clearTimeout(ecommerceTimeoutRef.current);
                  ecommerceTimeoutRef.current = null;
                }
                setShowEcommerceDropdown(true);
              }}
              onMouseLeave={() => {
                ecommerceTimeoutRef.current = setTimeout(() => {
                  setShowEcommerceDropdown(false);
                }, 200);
              }}
            >
              <Link
                href="/"
                className="text-gray-700 hover:text-primary-600 transition text-sm font-medium flex items-center"
              >
                E-commerce
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              {showEcommerceDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[22px] w-[600px] bg-white rounded-lg shadow-2xl py-8 z-50 border border-gray-200">
                  {/* Arrow pointing up */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                  <div className="px-8 relative">
                    <h3 className="text-2xl font-bold text-black mb-6">E-commerce</h3>
                    <div className="flex gap-8">
                      {/* Left Section */}
                      <div className="flex-1">
                        <Link
                          href="/"
                          className="flex items-center mb-4"
                        >
                          <span className="text-base font-medium text-gray-700">Shop Premium Merchandise</span>
                        </Link>
                        <div className="space-y-3">
                          <Link
                            href="/?category=T-Shirts"
                            className="flex items-center group relative"
                            onMouseEnter={() => setHoveredEcommerceItem('T-Shirts')}
                            onMouseLeave={() => setHoveredEcommerceItem(null)}
                          >
                            <div className={`w-1 h-8 mr-4 rounded-full transition-all duration-200 ${hoveredEcommerceItem === 'T-Shirts' ? 'bg-red-600' : 'bg-transparent'}`}></div>
                            <span className={`text-sm transition-colors duration-200 ${hoveredEcommerceItem === 'T-Shirts' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              T-Shirts
                            </span>
                          </Link>
                          <Link
                            href="/?category=Hoodies"
                            className="flex items-center group relative"
                            onMouseEnter={() => setHoveredEcommerceItem('Hoodies')}
                            onMouseLeave={() => setHoveredEcommerceItem(null)}
                          >
                            <div className={`w-1 h-8 mr-4 rounded-full transition-all duration-200 ${hoveredEcommerceItem === 'Hoodies' ? 'bg-red-600' : 'bg-transparent'}`}></div>
                            <span className={`text-sm transition-colors duration-200 ${hoveredEcommerceItem === 'Hoodies' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              Hoodies
                            </span>
                          </Link>
                          <Link
                            href="/?category=Bags"
                            className="flex items-center group relative"
                            onMouseEnter={() => setHoveredEcommerceItem('Bags')}
                            onMouseLeave={() => setHoveredEcommerceItem(null)}
                          >
                            <div className={`w-1 h-8 mr-4 rounded-full transition-all duration-200 ${hoveredEcommerceItem === 'Bags' ? 'bg-red-600' : 'bg-transparent'}`}></div>
                            <span className={`text-sm transition-colors duration-200 ${hoveredEcommerceItem === 'Bags' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              Bags
                            </span>
                          </Link>
                          <Link
                            href="/?category=Accessories"
                            className="flex items-center group relative"
                            onMouseEnter={() => setHoveredEcommerceItem('Accessories')}
                            onMouseLeave={() => setHoveredEcommerceItem(null)}
                          >
                            <div className={`w-1 h-8 mr-4 rounded-full transition-all duration-200 ${hoveredEcommerceItem === 'Accessories' ? 'bg-red-600' : 'bg-transparent'}`}></div>
                            <span className={`text-sm transition-colors duration-200 ${hoveredEcommerceItem === 'Accessories' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              Accessories
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div 
              className="relative group"
              onMouseEnter={() => {
                if (directoryTimeoutRef.current) {
                  clearTimeout(directoryTimeoutRef.current);
                  directoryTimeoutRef.current = null;
                }
                setShowDirectoryDropdown(true);
              }}
              onMouseLeave={() => {
                directoryTimeoutRef.current = setTimeout(() => {
                  setShowDirectoryDropdown(false);
                }, 200);
              }}
            >
              <Link
                href="/directory"
                className="text-gray-700 hover:text-primary-600 transition text-sm font-medium flex items-center"
              >
                Directory
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </Link>
              {showDirectoryDropdown && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-[22px] w-[600px] bg-white rounded-lg shadow-2xl py-8 z-50 border border-gray-200">
                  {/* Arrow pointing up */}
                  <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-l border-t border-gray-200 transform rotate-45"></div>
                  <div className="px-8 relative">
                    <h3 className="text-2xl font-bold text-black mb-6">Directory</h3>
                    <div className="flex gap-8">
                      {/* Left Section */}
                      <div className="flex-1">
                        <Link
                          href="/directory"
                          className="flex items-center mb-4"
                        >
                          <span className="text-base font-medium text-gray-700">Discover Businesses</span>
                        </Link>
                        <div className="space-y-3">
                          <Link
                            href="/directory"
                            className="flex items-center group relative"
                            onMouseEnter={() => setHoveredDirectoryItem('Business Directory')}
                            onMouseLeave={() => setHoveredDirectoryItem(null)}
                          >
                            <div className={`w-1 h-8 mr-4 rounded-full transition-all duration-200 ${hoveredDirectoryItem === 'Business Directory' ? 'bg-red-600' : 'bg-transparent'}`}></div>
                            <span className={`text-sm transition-colors duration-200 ${hoveredDirectoryItem === 'Business Directory' ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                              Business Directory
                            </span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <Link href="/news" className="text-gray-700 hover:text-primary-600 transition text-sm font-medium">
              News
            </Link>
            <Link href="/events" className="text-gray-700 hover:text-primary-600 transition text-sm font-medium">
              Events
            </Link>
            <Link href="/classifieds" className="text-gray-700 hover:text-primary-600 transition text-sm font-medium">
              Classifieds
            </Link>
            <Link href="/power-groups" className="text-gray-700 hover:text-primary-600 transition text-sm font-medium">
              Power Groups
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile Navigation */}
      {showMobileMenu && (
        <div className="lg:hidden border-t py-4">
          <nav className="flex flex-col space-y-4 px-4">
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
    </header>
  );
}
