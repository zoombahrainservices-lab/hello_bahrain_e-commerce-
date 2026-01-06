'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';

type Status = 'loading' | 'success' | 'failed';

function BenefitResponsePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clearCart } = useCart();
  const { fetchMe } = useAuth();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Processing payment...');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);
  const [hasProcessed, setHasProcessed] = useState(false); // Prevent infinite loop

  // Refresh auth on mount (after payment gateway redirect)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('[Benefit Response] Refreshing auth after payment gateway redirect');
    }
    fetchMe().catch(err => {
      console.error('[Benefit Response] Auth refresh failed:', err);
    });
  }, []); // Run once on mount

  useEffect(() => {
    // Prevent processing multiple times
    if (hasProcessed) {
      return;
    }

    const sessionIdParam = searchParams.get('sessionId');
    const trandataParam = searchParams.get('trandata');
    
    // Fallback: try to get sessionId from localStorage if not in URL
    const sessionId = sessionIdParam || (typeof window !== 'undefined' 
      ? window.localStorage.getItem('pending_checkout_session_id') 
      : null);

    if (!sessionId) {
      setStatus('failed');
      setMessage('Missing checkout session reference');
      return;
    }

    // Process BENEFIT response
    const processResponse = async () => {
      try {
        // BenefitPay redirects browser here with trandata in the URL
        // We need to process it on the server side
        if (trandataParam) {
          // Process trandata via API endpoint
          setHasProcessed(true); // Mark as processed to prevent re-processing
          if (process.env.NODE_ENV === 'development') {
            console.log('[Benefit Response] Processing trandata for session:', sessionId);
          }
          const response = await api.post('/api/payments/benefit/process-response', {
            sessionId: sessionId,
            trandata: trandataParam,
          });

          const data = response.data;
          if (process.env.NODE_ENV === 'development') {
            console.log('[Benefit Response] Process response result:', {
              success: data.success,
              hasOrderId: !!data.orderId,
              hasTransactionDetails: !!data.transactionDetails,
            });
          }

          if (data.success && data.orderId) {
            // Payment successful - treat as success regardless of message
            setStatus('success');
            setMessage('Payment successful! Thank you for your purchase.');
            setOrderId(data.orderId);
            setTransactionDetails(data.transactionDetails);
            
            // Clear cart ONLY after successful payment
            try {
              if (process.env.NODE_ENV === 'development') {
                console.log('[Benefit Response] Clearing cart after successful payment');
              }
              clearCart();
              if (process.env.NODE_ENV === 'development') {
                console.log('[Benefit Response] Cart cleared successfully');
              }
            } catch (error) {
              console.error('[Benefit Response] Error clearing cart:', error);
              // Don't block the success flow if cart clearing fails
            }
            
            // Store recent order info for redirect detection
            if (typeof window !== 'undefined') {
              localStorage.setItem('hb_recent_order', JSON.stringify({
                orderId: data.orderId,
                timestamp: Date.now(),
              }));
              
              // Remove pending session ID
              window.localStorage.removeItem('pending_checkout_session_id');
              
              // Dispatch event to refresh orders list
              window.dispatchEvent(new CustomEvent('orderPlaced', { 
                detail: { orderId: data.orderId } 
              }));
            }
          } else {
            // Payment failed or canceled
            setStatus('failed');
            
            // Show detailed error message if available
            const errorMessage = data.message || data.error || 'Payment was not completed.';
            setMessage(errorMessage);
            
            // Log error details for debugging
            console.error('[Benefit Response] Payment failed:', {
              message: data.message,
              error: data.error,
              details: data.details,
              paymentId: data.paymentId,
              trackId: data.trackId,
            });
            
            // Show paymentId/trackId if available (for canceled/failed payments)
            if (data.paymentId || data.trackId) {
              setTransactionDetails({
                paymentId: data.paymentId,
                trackId: data.trackId,
              });
            }
            
            // Remove pending session ID if payment failed
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('pending_checkout_session_id');
            }
          }
        } else {
          // No trandata - call process-response without trandata to get session info
          // This handles cases where payment was canceled or already processed via webhook
          setHasProcessed(true); // Mark as processed to prevent re-processing
          if (process.env.NODE_ENV === 'development') {
            console.log('[Benefit Response] No trandata in URL, checking session status for:', sessionId);
          }
          try {
            const response = await api.post('/api/payments/benefit/process-response', {
              sessionId: sessionId,
              // trandata is intentionally omitted
            });

            const data = response.data;
            if (process.env.NODE_ENV === 'development') {
              console.log('[Benefit Response] Session status check result:', {
                success: data.success,
                hasOrderId: !!data.orderId,
                hasPaymentId: !!data.paymentId,
                message: data.message,
              });
            }

            if (data.success && data.orderId) {
              // Payment successful (webhook already processed)
              setStatus('success');
              setMessage('Payment successful! Thank you for your purchase.');
              setOrderId(data.orderId);
              setTransactionDetails(data.transactionDetails);
              
              // Clear cart ONLY after successful payment
              try {
                clearCart();
              } catch (error) {
                console.error('Error clearing cart:', error);
              }
              
              // Store recent order info
              if (typeof window !== 'undefined') {
                localStorage.setItem('hb_recent_order', JSON.stringify({
                  orderId: data.orderId,
                  timestamp: Date.now(),
                }));
                window.localStorage.removeItem('pending_checkout_session_id');
                window.dispatchEvent(new CustomEvent('orderPlaced', { 
                  detail: { orderId: data.orderId } 
                }));
              }
            } else {
              // Payment failed or canceled
              setStatus('failed');
              
              // Show detailed error message if available
              const errorMessage = data.message || data.error || 'Payment was not completed.';
              setMessage(errorMessage);
              
              // Log error details for debugging
              console.error('[Benefit Response] Payment failed (no trandata):', {
                message: data.message,
                error: data.error,
                details: data.details,
                paymentId: data.paymentId,
                trackId: data.trackId,
                sessionStatus: data.sessionStatus,
              });
              
              // Show paymentId/trackId if available (for canceled/failed payments)
              if (data.paymentId || data.trackId) {
                setTransactionDetails({
                  paymentId: data.paymentId,
                  trackId: data.trackId,
                });
              }
              
              if (typeof window !== 'undefined') {
                window.localStorage.removeItem('pending_checkout_session_id');
              }
            }
          } catch (checkError: any) {
            console.error('Error checking payment status:', checkError);
            setStatus('failed');
            setMessage(checkError.response?.data?.message || 'Error verifying payment status. Please contact support.');
            if (typeof window !== 'undefined') {
              window.localStorage.removeItem('pending_checkout_session_id');
            }
          }
        }
      } catch (error: any) {
        console.error('[Benefit Response] Error processing BENEFIT response:', {
          error,
          response: error.response?.data,
          message: error.message,
          status: error.response?.status,
        });
        setStatus('failed');
        
        // Show detailed error message
        const errorMessage = error.response?.data?.message 
          || error.response?.data?.error 
          || error.message 
          || 'Error processing payment. Please contact support.';
        setMessage(errorMessage);
        
        // Show error details in development
        if (process.env.NODE_ENV === 'development' && error.response?.data?.details) {
          console.error('[Benefit Response] Error details:', error.response.data.details);
        }
        
        // Remove pending session ID on error
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem('pending_checkout_session_id');
        }
      }
    };

    processResponse();
  }, [searchParams]); // Removed clearCart from dependencies to prevent infinite loop

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

            {/* Show paymentId/trackId if available (for canceled payments) */}
            {transactionDetails && (transactionDetails.paymentId || transactionDetails.trackId) && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="font-semibold mb-2 text-sm text-gray-700">Payment Reference</h2>
                <div className="space-y-1 text-sm">
                  {transactionDetails.paymentId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment ID:</span>
                      <span className="font-medium">{transactionDetails.paymentId}</span>
                    </div>
                  )}
                  {transactionDetails.trackId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Track ID:</span>
                      <span className="font-medium">{transactionDetails.trackId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

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
                {transactionDetails.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium">{transactionDetails.paymentId}</span>
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
            {orderId && (
              <Link
                href={`/order/success?orderId=${orderId}`}
                className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition text-center font-semibold"
              >
                View Order Details
              </Link>
            )}
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


