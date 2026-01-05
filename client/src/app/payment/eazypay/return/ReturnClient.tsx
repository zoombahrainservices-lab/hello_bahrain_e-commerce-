'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/contexts/CartContext';
import { api } from '@/lib/api';

type Status = 'loading' | 'success' | 'failed';

export default function ReturnClient() {
  const params = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Verifying payment…');

  useEffect(() => {
    const sessionId = params.get('sessionId');
    const globalTransactionsId = params.get('globalTransactionsId');

    if (!sessionId) {
      setStatus('failed');
      setMessage('Missing checkout session reference.');
      return;
    }

    const checkStatus = async () => {
      try {
        // Call session complete endpoint to verify payment and create order
        const res = await api.post(`/api/checkout-sessions/${sessionId}/complete`, {
          globalTransactionsId: globalTransactionsId || undefined,
        });

        const data = res.data;

        if (data.success && data.orderId) {
          setStatus('success');
          setMessage('Payment successful! Thank you for shopping with HelloOneBahrain.');
          
          // Store recent order info for redirect detection
          if (typeof window !== 'undefined') {
            localStorage.setItem('hb_recent_order', JSON.stringify({
              orderId: data.orderId,
              timestamp: Date.now(),
            }));
            
            // Remove pending session ID from localStorage
            window.localStorage.removeItem('pending_checkout_session_id');
          }
          
          // Clear cart and redirect to order success page
          clearCart();
          // Small delay to show success message before redirect
          setTimeout(() => {
            router.push(`/order/success?orderId=${data.orderId}`);
          }, 1500);
        } else if (data.pending) {
          // Payment is still pending
          setStatus('loading');
          setMessage('Payment is being processed. Please wait...');
          
          // Poll a few times for pending payments
          let pollCount = 0;
          const maxPolls = 3;
          const pollInterval = setInterval(async () => {
            pollCount++;
            try {
              const pollRes = await api.post(`/api/checkout-sessions/${sessionId}/complete`, {
                globalTransactionsId: globalTransactionsId || undefined,
              });
              
              const pollData = pollRes.data;
              
              if (pollData.success && pollData.orderId) {
                clearInterval(pollInterval);
                setStatus('success');
                setMessage('Payment successful! Thank you for shopping with HelloOneBahrain.');
                
                if (typeof window !== 'undefined') {
                  localStorage.setItem('hb_recent_order', JSON.stringify({
                    orderId: pollData.orderId,
                    timestamp: Date.now(),
                  }));
                  window.localStorage.removeItem('pending_checkout_session_id');
                }
                
                clearCart();
                setTimeout(() => {
                  router.push(`/order/success?orderId=${pollData.orderId}`);
                }, 1500);
              } else if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setStatus('failed');
                setMessage('Payment verification timed out. Please check your orders or contact support.');
              }
            } catch (pollErr) {
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setStatus('failed');
                setMessage('Error verifying payment status.');
              }
            }
          }, 2000); // Poll every 2 seconds
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment failed or cancelled.');
          // Remove pending session ID if payment failed
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('pending_checkout_session_id');
          }
        }
      } catch (err: any) {
        console.error(err);
        setStatus('failed');
        setMessage(err.response?.data?.message || 'Error verifying payment.');
        // Remove pending session ID on error
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pending_checkout_session_id');
        }
      }
    };

    checkStatus();
  }, [params, clearCart, router]);

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">EazyPay Payment Result</h1>
      <p className="mb-6">{message}</p>

      {status === 'success' && (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Redirecting to order confirmation...</p>
          <div className="flex gap-4">
            <a
              href="/order/success"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Continue to Order Confirmation
            </a>
            <a
              href="/profile/orders"
              className="inline-block bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition"
            >
              View Orders
            </a>
          </div>
        </div>
      )}

      {status === 'failed' && (
        <div className="space-y-4">
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
                  Don&apos;t worry! Your items are still in your cart. You can try again or choose a different payment method.
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-4">
            <a
              href="/checkout/payment"
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-center font-semibold"
            >
              Try Payment Again
            </a>
            <a
              href="/cart"
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
            >
              View Cart
            </a>
          </div>
        </div>
      )}
    </main>
  );
}



