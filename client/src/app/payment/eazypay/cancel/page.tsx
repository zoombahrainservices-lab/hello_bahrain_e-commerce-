'use client';

import Link from 'next/link';

export default function EazyPayCancelPage() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-red-600">Payment Cancelled</h1>

        <div className="space-y-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-red-600 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="text-red-800 font-semibold">Your payment was cancelled.</p>
                <p className="text-red-700 text-sm mt-1">
                  No charges were made to your account.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="w-6 h-6 text-green-600 mr-2 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <h3 className="font-semibold text-green-900 mb-2">Your cart is intact</h3>
                <p className="text-green-800 text-sm">
                  Don't worry! Your items are still in your cart. You can try again or choose a different payment method.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Link
              href="/checkout/payment"
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-center font-semibold"
            >
              Try Payment Again
            </Link>
            <Link
              href="/cart"
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
            >
              View Cart
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}












