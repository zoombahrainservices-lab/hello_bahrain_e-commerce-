'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';

type Status = 'loading' | 'success' | 'failed';

function BenefitResponsePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Processing payment...');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const trandataParam = searchParams.get('trandata');

    if (!orderIdParam) {
      setStatus('failed');
      setMessage('Missing order ID');
      return;
    }

    setOrderId(orderIdParam);

    // Process BENEFIT response
    const processResponse = async () => {
      try {
        // BenefitPay redirects browser here with trandata in the URL
        // We need to process it on the server side
        if (trandataParam) {
          // Process trandata via API endpoint
          const response = await api.post('/api/payments/benefit/process-response', {
            orderId: orderIdParam,
            trandata: trandataParam,
          });

          const data = response.data;

          if (data.success) {
            setStatus('success');
            setMessage('Payment successful! Thank you for your purchase.');
            setTransactionDetails(data.transactionDetails);
            
            // Clear cart after successful payment
            try {
              clearCart();
            } catch (error) {
              console.error('Error clearing cart:', error);
              // Don't block the success flow if cart clearing fails
            }
            
            // Store recent order info for redirect detection (similar to other payment methods)
            if (typeof window !== 'undefined') {
              localStorage.setItem('hb_recent_order', JSON.stringify({
                orderId: orderIdParam || null,
                timestamp: Date.now(),
              }));
            }
          } else {
            setStatus('failed');
            setMessage(data.message || 'Payment was not completed.');
          }
        } else {
          // No trandata - check order status from database
          // This handles cases where payment was already processed
          const orderResponse = await api.get(`/api/orders/my`);
          const orders = orderResponse.data;
          const order = Array.isArray(orders) 
            ? orders.find((o: any) => (o.id === orderIdParam || o._id === orderIdParam)) 
            : null;

          if (order && (order.paymentStatus === 'paid' || order.payment_status === 'paid')) {
            setStatus('success');
            setMessage('Payment successful! Thank you for your purchase.');
            setTransactionDetails({
              transId: order.benefit_trans_id,
              ref: order.benefit_ref,
              authRespCode: order.benefit_auth_resp_code,
            });
            
            // Clear cart after successful payment
            try {
              clearCart();
            } catch (error) {
              console.error('Error clearing cart:', error);
              // Don't block the success flow if cart clearing fails
            }
            
            // Store recent order info for redirect detection (similar to other payment methods)
            if (typeof window !== 'undefined') {
              localStorage.setItem('hb_recent_order', JSON.stringify({
                orderId: orderIdParam || null,
                timestamp: Date.now(),
              }));
            }
          } else if (order && (order.paymentStatus === 'failed' || order.payment_status === 'failed')) {
            setStatus('failed');
            setMessage('Payment was not completed.');
          } else {
            // Order not found or status unclear
            setStatus('failed');
            setMessage('Unable to verify payment status. Please check your orders or contact support.');
          }
        }
      } catch (error: any) {
        console.error('Error processing BENEFIT response:', error);
        setStatus('failed');
        setMessage(error.response?.data?.message || 'Error processing payment. Please contact support.');
      }
    };

    processResponse();
  }, [searchParams, clearCart]);

  if (status === 'loading') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">{message}</p>
          </div>
        </div>
      </main>
    );
  }

  if (status === 'failed') {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold mb-6 text-red-600">Payment Failed</h1>

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
                  <p className="text-red-800 font-semibold">{message}</p>
                </div>
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
                href="/profile/orders"
                className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
              >
                View Orders
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Success
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-lg shadow-md p-8">
        <h1 className="text-3xl font-bold mb-6 text-green-600">Payment Successful!</h1>

        <div className="space-y-6">
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
                <p className="text-green-800 font-semibold">{message}</p>
                <p className="text-green-700 text-sm mt-1">
                  Your order has been confirmed and will be processed shortly.
                </p>
              </div>
            </div>
          </div>

          {transactionDetails && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="font-semibold mb-2 text-sm text-gray-700">Transaction Details</h2>
              <div className="space-y-1 text-sm">
                {orderId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{orderId}</span>
                  </div>
                )}
                {transactionDetails.transId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction ID:</span>
                    <span className="font-medium">{transactionDetails.transId}</span>
                  </div>
                )}
                {transactionDetails.ref && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Reference:</span>
                    <span className="font-medium">{transactionDetails.ref}</span>
                  </div>
                )}
                {transactionDetails.authRespCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Auth Code:</span>
                    <span className="font-medium">{transactionDetails.authRespCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>You will receive an order confirmation email</li>
              <li>Your order will be prepared for shipment</li>
              <li>You can track your order status in your account</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Link
              href="/profile/orders"
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-center font-semibold"
            >
              View My Orders
            </Link>
            <Link
              href="/"
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition text-center font-semibold"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BenefitResponseClient() {
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
      <BenefitResponsePageContent />
    </Suspense>
  );
}


