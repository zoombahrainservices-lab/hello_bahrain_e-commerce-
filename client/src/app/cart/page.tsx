'use client';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const RECENT_ORDER_KEY = 'hb_recent_order';

export default function CartPage() {
  const { items, removeItem, updateQuantity, getTotal, clearCart } = useCart();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const router = useRouter();
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [checkingOrder, setCheckingOrder] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // Check URL parameter
    const params = new URLSearchParams(window.location.search);
    const hasOrderSuccess = params.get('orderSuccess') === 'true';
    
    // Check localStorage for recent order (within last 30 seconds)
    const recentOrderData = localStorage.getItem(RECENT_ORDER_KEY);
    let hasRecentOrder = false;
    
    if (recentOrderData) {
      try {
        const { timestamp } = JSON.parse(recentOrderData);
        const timeSinceOrder = Date.now() - timestamp;
        
        // CRITICAL FIX: Only redirect if cart is EMPTY
        // If user has items, they're starting a new order - show cart normally
        if (timeSinceOrder < 30000 && items.length === 0) {
          hasRecentOrder = true;
          const orderId = JSON.parse(recentOrderData).orderId;
          // Redirect to success page only if cart is empty
          if (orderId) {
            router.replace(`/order/success?orderId=${orderId}`);
          } else {
            router.replace('/order/success');
          }
          return;
        } else if (timeSinceOrder >= 30000) {
          // Remove old order data after 30 seconds
          localStorage.removeItem(RECENT_ORDER_KEY);
        }
        // If cart has items, don't redirect - clear the marker
        if (items.length > 0) {
          localStorage.removeItem(RECENT_ORDER_KEY);
        }
      } catch (e) {
        localStorage.removeItem(RECENT_ORDER_KEY);
      }
    }
    
    setOrderSuccess(hasOrderSuccess || hasRecentOrder);
    setCheckingOrder(false);
    
    // Clear the URL parameter after reading it
    if (hasOrderSuccess) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, [router, items.length]); // Add items.length as dependency

  if (authLoading || checkingOrder) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Login Required</h1>
        <p className="text-gray-600 mb-6">
          Please log in to continue. Only logged-in users can view the cart and add items.
        </p>
        <button
          onClick={() => router.push('/auth/login?redirect=/cart')}
          className="bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          Login to Continue
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">
            {orderSuccess ? 'Order Placed Successfully' : 'Your Cart is Empty'}
          </h1>
          <p className="text-gray-600 mb-8">
            {orderSuccess
              ? 'Thank you for your purchase! Your cart is now empty.'
              : 'Add some products to get started!'}
          </p>
          <Link
            href="/"
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            Continue Shopping
          </Link>
          {orderSuccess && (
            <p className="mt-4 text-sm text-gray-600">
              You can view your order history anytime on the{' '}
              <Link href="/profile/orders" className="text-primary-600 hover:text-primary-700 underline">
                My Orders
              </Link>{' '}
              page.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Shopping Cart</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            {items.map((item) => (
              <div
                key={item.productId}
                className="flex items-center gap-4 py-4 border-b last:border-b-0"
              >
                <Link href={`/product/${item.slug}`} className="relative w-24 h-24 flex-shrink-0">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover rounded"
                  />
                </Link>

                <div className="flex-1">
                  <Link href={`/product/${item.slug}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-primary-600 transition">
                      {item.name}
                    </h3>
                  </Link>
                  <p className="text-gray-600">{formatPrice(item.price, language === 'ar' ? 'ar-BH' : 'en-BH')}</p>
                  {item.stockQuantity && item.quantity >= item.stockQuantity && (
                    <p className="text-xs text-orange-600 mt-1 font-semibold">⚠ Max stock reached</p>
                  )}
                </div>

                <div className="flex items-center border border-gray-300 rounded-lg">
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                    className="px-3 py-1 hover:bg-gray-100 transition"
                    disabled={item.quantity <= 1}
                  >
                    -
                  </button>
                  <span className="px-4 py-1 border-x font-semibold">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                    className="px-3 py-1 hover:bg-gray-100 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={item.stockQuantity !== undefined && item.quantity >= item.stockQuantity}
                    title={
                      item.stockQuantity !== undefined && item.quantity >= item.stockQuantity
                        ? 'Maximum stock reached'
                        : undefined
                    }
                  >
                    +
                  </button>
                </div>

                <p className="font-semibold w-24 text-right">
                  {formatPrice(item.price * item.quantity, language === 'ar' ? 'ar-BH' : 'en-BH')}
                </p>

                <button
                  onClick={() => removeItem(item.productId)}
                  className="text-red-500 hover:text-red-700 p-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            ))}

            <button
              onClick={clearCart}
              className="mt-4 text-red-500 hover:text-red-700 text-sm"
            >
              Clear Cart
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span className="text-gray-600">{t('subtotal')}</span>
                <span className="font-semibold">{formatPrice(getTotal(), language === 'ar' ? 'ar-BH' : 'en-BH')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">{language === 'ar' ? 'الشحن' : 'Shipping'}</span>
                <span className="font-semibold">{language === 'ar' ? 'يحسب عند الدفع' : 'Calculated at checkout'}</span>
              </div>
            </div>

            <div className="border-t pt-4 mb-6">
              <div className="flex justify-between text-lg font-bold">
                <span>{language === 'ar' ? 'المجموع' : 'Total'}</span>
                <span>{formatPrice(getTotal(), language === 'ar' ? 'ar-BH' : 'en-BH')}</span>
              </div>
            </div>

            <button
              onClick={() => router.push('/checkout')}
              className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition"
            >
              Proceed to Checkout
            </button>

            <Link
              href="/"
              className="block text-center text-primary-600 hover:text-primary-700 mt-4"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

