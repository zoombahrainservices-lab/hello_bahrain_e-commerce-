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
    const orderId = params.get('orderId') ?? params.get('order.id');

    if (!orderId) {
      setStatus('failed');
      setMessage('Missing order reference.');
      return;
    }

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/eazypay/status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId }),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || data?.error || 'Status error');

        const result = data.result;
        const transactions = (data.transaction as any) || (data.transactions as any);
        const lastTxn = Array.isArray(transactions) ? transactions[transactions.length - 1] : undefined;

        const isSuccess =
          result === 'SUCCESS' &&
          lastTxn &&
          (lastTxn.result === 'SUCCESS' || lastTxn.response?.acquirerCode === '00');

        if (isSuccess) {
          // Create the order using stored order data
          try {
            const pendingOrderData = typeof window !== 'undefined' 
              ? window.localStorage.getItem('pending_order_data') 
              : null;

            if (pendingOrderData) {
              const orderData = JSON.parse(pendingOrderData);
              // Create order with payment_status='paid' since payment was successful
              await api.post('/api/orders', {
                ...orderData,
                paymentStatus: 'paid',
              });
              
              // Remove pending order data and shipping data from localStorage
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('pending_order_data');
                window.localStorage.removeItem('hb_shipping_address');
              }
            }
          } catch (orderErr: any) {
            console.error('Error creating order after payment:', orderErr);
            // Don't fail the whole flow if order creation fails - payment was successful
          }

          setStatus('success');
          setMessage('Payment successful! Thank you for shopping with HelloOneBahrain.');
          // Clear cart and redirect to cart page with success message
          clearCart();
          // Small delay to show success message before redirect
          setTimeout(() => {
            router.push('/cart?orderSuccess=true');
          }, 1500);
        } else {
          setStatus('failed');
          setMessage('Payment failed or cancelled.');
          // Remove pending order data if payment failed
          if (typeof window !== 'undefined') {
            window.localStorage.removeItem('pending_order_data');
          }
        }
      } catch (err) {
        console.error(err);
        setStatus('failed');
        setMessage('Error verifying payment.');
        // Remove pending order data on error
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pending_order_data');
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
          <p className="text-sm text-gray-600">Redirecting to your cart...</p>
          <div className="flex gap-4">
            <a
              href="/cart?orderSuccess=true"
              className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
            >
              Continue Shopping
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
        <a
          href="/checkout/payment"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          Back to payment
        </a>
      )}
    </main>
  );
}



