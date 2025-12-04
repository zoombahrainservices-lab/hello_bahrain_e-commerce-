'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Status = 'loading' | 'success' | 'failed';

export default function EazyPayReturnPage() {
  const params = useSearchParams();
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
        const lastTxn = Array.isArray(transactions)
          ? transactions[transactions.length - 1]
          : undefined;

        const isSuccess =
          result === 'SUCCESS' &&
          lastTxn &&
          (lastTxn.result === 'SUCCESS' ||
            lastTxn.response?.acquirerCode === '00');

        if (isSuccess) {
          setStatus('success');
          setMessage('Payment successful! Thank you for shopping with HellowOneBahrain.');
        } else {
          setStatus('failed');
          setMessage('Payment failed or cancelled.');
        }
      } catch (err) {
        console.error(err);
        setStatus('failed');
        setMessage('Error verifying payment.');
      }
    };

    checkStatus();
  }, [params]);

  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">EazyPay Payment Result</h1>
      <p className="mb-6">{message}</p>

      {status === 'success' && (
        <a
          href="/profile/orders"
          className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
        >
          View your orders
        </a>
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


