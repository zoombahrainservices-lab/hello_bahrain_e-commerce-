'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function BenefitErrorContent() {
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState('Payment was not completed');
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const orderIdParam = searchParams.get('orderId');
    const sessionIdParam = searchParams.get('sessionId');
    const trandataParam = searchParams.get('trandata');
    const errorTextParam = searchParams.get('ErrorText');
    const errorParam = searchParams.get('Error');
    const paymentIdParam = searchParams.get('paymentid');

    setOrderId(orderIdParam);

    const processError = async () => {
      try {
        let paymentIdFromTrandata: string | null = null;
        let errorDetailsFromTrandata: any = null;

        if (trandataParam) {
          const response = await api.post('/api/payments/benefit/process-error', {
            orderId: orderIdParam,
            sessionId: sessionIdParam, // Pass sessionId to endpoint
            trandata: trandataParam,
          });
          const data = response.data;
          setErrorMessage(data.message || 'Payment failed');
          errorDetailsFromTrandata = data.errorDetails;
          paymentIdFromTrandata = data.errorDetails?.paymentId || null;
        } else {
          const errorMsg = errorTextParam || errorParam || 'Payment was not completed';
          setErrorMessage(errorMsg);
          if (paymentIdParam) {
            errorDetailsFromTrandata = { paymentId: paymentIdParam };
            paymentIdFromTrandata = paymentIdParam;
          }
        }

        // If we have sessionId but no paymentId yet, fetch from checkout session
        let paymentIdFromSession: string | null = null;
        if (sessionIdParam && !paymentIdFromTrandata && !paymentIdParam) {
          try {
            const sessionResponse = await api.get(`/api/checkout-sessions/${sessionIdParam}`);
            const session = sessionResponse.data;
            if (session?.benefit_payment_id) {
              paymentIdFromSession = session.benefit_payment_id;
              console.log('[BENEFIT Error] Found payment ID from checkout session:', paymentIdFromSession);
            }
          } catch (sessionError) {
            console.warn('[BENEFIT Error] Failed to fetch checkout session:', sessionError);
            // Non-critical error, continue
          }
        }

        // Combine error details, prioritizing trandata, then URL param, then session
        const finalErrorDetails: any = errorDetailsFromTrandata || {};
        if (paymentIdFromTrandata || paymentIdParam || paymentIdFromSession) {
          finalErrorDetails.paymentId = paymentIdFromTrandata || paymentIdParam || paymentIdFromSession;
        }
        
        if (Object.keys(finalErrorDetails).length > 0) {
          setErrorDetails(finalErrorDetails);
        }

        if (orderIdParam) {
          try {
            await api.post('/api/payments/benefit/mark-failed', {
              orderId: orderIdParam,
            });
          } catch (markError) {
            console.error('Failed to mark order as failed:', markError);
          }
        }
      } catch (error: any) {
        console.error('Error processing BENEFIT error:', error);
        setErrorMessage('An error occurred while processing the payment');
      } finally {
        setLoading(false);
      }
    };

    processError();
  }, [searchParams]);

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Processing...</p>
          </div>
        </div>
      </main>
    );
  }

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
                <p className="text-red-800 font-semibold">{errorMessage}</p>
                <p className="text-red-700 text-sm mt-1">
                  Your payment could not be processed. Please try again or contact support if the problem persists.
                </p>
              </div>
            </div>
          </div>

          {errorDetails && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <h2 className="font-semibold mb-2 text-sm text-gray-700">Error Details</h2>
              <div className="space-y-1 text-sm">
                {errorDetails.paymentId && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium">{errorDetails.paymentId}</span>
                  </div>
                )}
                {errorDetails.result && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Result:</span>
                    <span className="font-medium">{errorDetails.result}</span>
                  </div>
                )}
                {errorDetails.authRespCode && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Response Code:</span>
                    <span className="font-medium">{errorDetails.authRespCode}</span>
                  </div>
                )}
              </div>
            </div>
          )}

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

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">What can you do?</h3>
            <ul className="list-disc list-inside text-blue-800 text-sm space-y-1">
              <li>Check your card details and try again</li>
              <li>Ensure you have sufficient funds</li>
              <li>Try a different payment method</li>
              <li>Contact your bank if the issue persists</li>
            </ul>
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

          <div className="text-center">
            <Link
              href="/contact"
              className="text-primary-600 hover:text-primary-700 underline text-sm"
            >
              Need help? Contact Support
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function BenefitErrorPage() {
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
      <BenefitErrorContent />
    </Suspense>
  );
}
