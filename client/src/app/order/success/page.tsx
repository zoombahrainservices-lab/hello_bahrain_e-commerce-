'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';

function OrderSuccessClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clearCart } = useCart();
  const [orderId, setOrderId] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Get order ID from URL if available
    const id = searchParams.get('orderId');
    if (id) {
      setOrderId(id);
    }

    // Clear cart on success page load (only once)
    try {
      clearCart();
    } catch (error) {
      console.error('Error clearing cart:', error);
      // Don't block the page if cart clearing fails
    }

    // Dispatch event to refresh orders list
    if (typeof window !== 'undefined' && id) {
      window.dispatchEvent(new CustomEvent('orderPlaced', { 
        detail: { orderId: id } 
      }));
    }
  }, [searchParams, clearCart]);

  const handleContinueShopping = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/';
  };

  const handleViewOrders = (e: React.MouseEvent) => {
    e.preventDefault();
    window.location.href = '/profile/orders';
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8 text-center">
        {/* Success Icon */}
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
          <svg
            className="h-12 w-12 text-green-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Order Placed Successfully!</h1>
        <p className="text-lg text-gray-600 mb-2">
          Thank you for your purchase. Your order has been confirmed.
        </p>
        
        {orderId && (
          <p className="text-sm text-gray-500 mb-8">
            Order ID: <span className="font-semibold">{orderId}</span>
          </p>
        )}

        <p className="text-gray-600 mb-8">
          We&apos;ll send you an email confirmation shortly with your order details.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={handleContinueShopping}
            className="inline-block bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition cursor-pointer"
          >
            Continue Shopping
          </button>
          <button
            type="button"
            onClick={handleViewOrders}
            className="inline-block bg-gray-200 text-gray-800 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition cursor-pointer"
          >
            View My Orders
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            Need help?{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/contact';
              }}
              className="text-primary-600 hover:text-primary-700 underline cursor-pointer bg-transparent border-none p-0"
            >
              Contact us
            </button>
            {' '}or check your{' '}
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = '/profile/orders';
              }}
              className="text-primary-600 hover:text-primary-700 underline cursor-pointer bg-transparent border-none p-0"
            >
              order status
            </button>
            .
          </p>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
