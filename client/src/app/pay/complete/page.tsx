'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Status = 'loading' | 'success' | 'failed';

function PaymentCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Processing payment...');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [dccReceiptText, setDccReceiptText] = useState<string | null>(null);

  useEffect(() => {
    // CRITICAL: EazyPay appends globalTransactionsId to returnUrl
    // URL format: /pay/complete?orderId=123&globalTransactionsId=abc...
    const orderIdParam = searchParams.get('orderId');
    const globalTransactionsIdParam = searchParams.get('globalTransactionsId');

    if (!orderIdParam && !globalTransactionsIdParam) {
      setStatus('failed');
      setMessage('Missing order ID or transaction ID');
      return;
    }

    setOrderId(orderIdParam);

    // Query payment status from backend
    // CRITICAL: Never mark as paid without server-side verification
    const checkPaymentStatus = async () => {
      try {
        // Use globalTransactionsId if available (preferred), otherwise use orderId
        const response = await api.post('/api/payments/eazypay/query', {
          ...(globalTransactionsIdParam && { globalTransactionsId: globalTransactionsIdParam }),
          ...(orderIdParam && { orderId: orderIdParam }),
        });

        const data = response.data;
        
        // Handle PENDING status
        if (data.status === 'PENDING' || (!data.isPaid && data.status !== 'CANCELED')) {
          setStatus('loading');
          setMessage('Payment is being processed. Please wait...');
          
          // Poll a few times for PENDING payments
          let pollCount = 0;
          const maxPolls = 3;
          const pollInterval = setInterval(async () => {
            pollCount++;
            try {
              const pollResponse = await api.post('/api/payments/eazypay/query', {
                ...(globalTransactionsIdParam && { globalTransactionsId: globalTransactionsIdParam }),
                ...(orderIdParam && { orderId: orderIdParam }),
              });
              
              const pollData = pollResponse.data;
              if (pollData.isPaid) {
                clearInterval(pollInterval);
                setStatus('success');
                setMessage('Payment successful! Thank you for your purchase.');
                if (pollData.dccReceiptText) {
                  setDccReceiptText(pollData.dccReceiptText);
                }
              } else if (pollData.status === 'CANCELED' || pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setStatus('failed');
                setMessage('Payment was not completed. Please try again or contact support.');
              }
            } catch (pollError) {
              if (pollCount >= maxPolls) {
                clearInterval(pollInterval);
                setStatus('failed');
                setMessage('Unable to verify payment status. Please contact support.');
              }
            }
          }, 3000); // Poll every 3 seconds
          
          return;
        }

        // Handle final status
        if (data.isPaid) {
          setStatus('success');
          setMessage('Payment successful! Thank you for your purchase.');
          if (data.dccReceiptText) {
            setDccReceiptText(data.dccReceiptText);
          }
        } else {
          setStatus('failed');
          setMessage('Payment was not completed. Please try again.');
        }
      } catch (error: any) {
        console.error('Payment status check error:', error);
        setStatus('failed');
        setMessage(
          error.response?.data?.message || 'Error verifying payment. Please contact support.'
        );
      }
    };

    // Small delay to allow webhook to process first
    setTimeout(checkPaymentStatus, 2000);
  }, [searchParams]);

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6">Payment Status</h1>

        {status === 'loading' && (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        )}

        {status === 'success' && (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-green-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                <p className="text-green-800 font-semibold">{message}</p>
              </div>
            </div>

            {dccReceiptText && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="font-semibold mb-2">Currency Conversion Receipt</h2>
                <div
                  className="prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: dccReceiptText }}
                />
              </div>
            )}

            <div className="flex gap-4">
              <Link
                href={`/order/success?orderId=${orderId}`}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-center font-semibold"
              >
                View Order Details
              </Link>
              <Link
                href="/profile/orders"
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
              >
                My Orders
              </Link>
            </div>
          </div>
        )}

        {status === 'failed' && (
          <div className="space-y-6">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <svg
                  className="w-6 h-6 text-red-600 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
                <p className="text-red-800 font-semibold">{message}</p>
              </div>
            </div>

            <div className="flex gap-4">
              <Link
                href="/checkout/payment"
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-center font-semibold"
              >
                Try Again
              </Link>
              <Link
                href="/contact"
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
              >
                Contact Support
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

export default function PaymentCompletePage() {
  return (
    <Suspense
      fallback={
        <main className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading...</p>
            </div>
          </div>
        </main>
      }
    >
      <PaymentCompleteContent />
    </Suspense>
  );
}

