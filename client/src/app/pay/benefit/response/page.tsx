'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

type Status = 'loading' | 'success' | 'failed';

function BenefitResponsePageContent() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/fd6745cd-3673-4b32-8e6c-a748b411f1f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pay/benefit/response/page.tsx:10',message:'BenefitResponsePageContent component mounted',data:{timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion

  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<Status>('loading');
  const [message, setMessage] = useState('Processing payment...');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [transactionDetails, setTransactionDetails] = useState<any>(null);

  useEffect(() => {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/fd6745cd-3673-4b32-8e6c-a748b411f1f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pay/benefit/response/page.tsx:18',message:'useEffect triggered',data:{timestamp:Date.now(),hasSearchParams:!!searchParams},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion

    const orderIdParam = searchParams.get('orderId');
    const trandataParam = searchParams.get('trandata');

    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/fd6745cd-3673-4b32-8e6c-a748b411f1f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pay/benefit/response/page.tsx:22',message:'URL params extracted',data:{hasOrderId:!!orderIdParam,hasTrandata:!!trandataParam,orderIdLength:orderIdParam?.length||0,trandataLength:trandataParam?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    }
    // #endregion

    if (!orderIdParam) {
      setStatus('failed');
      setMessage('Missing order ID');
      return;
    }

    if (!trandataParam) {
      setStatus('failed');
      setMessage('Missing transaction data');
      return;
    }

    setOrderId(orderIdParam);

    // Process BENEFIT response
    const processResponse = async () => {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/fd6745cd-3673-4b32-8e6c-a748b411f1f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pay/benefit/response/page.tsx:37',message:'processResponse started',data:{orderId:orderIdParam,trandataLength:trandataParam?.length||0},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion

      try {
        // Call backend to decrypt and validate trandata
        const response = await api.post('/api/payments/benefit/process-response', {
          orderId: orderIdParam,
          trandata: trandataParam,
        });

        const data = response.data;

        if (data.success) {
          setStatus('success');
          setMessage('Payment successful! Thank you for your purchase.');
          setTransactionDetails(data.transactionDetails);
        } else {
          setStatus('failed');
          setMessage(data.message || 'Payment was not completed.');
        }
      } catch (error: any) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/fd6745cd-3673-4b32-8e6c-a748b411f1f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pay/benefit/response/page.tsx:55',message:'processResponse error',data:{errorMessage:error?.message,statusCode:error?.response?.status,hasResponse:!!error?.response},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'F'})}).catch(()=>{});
        }
        // #endregion

        console.error('BENEFIT response processing error:', error);
        setStatus('failed');
        setMessage(
          error.response?.data?.message || 'Error verifying payment. Please contact support.'
        );
      }
    };

    // Small delay to show loading state
    setTimeout(processResponse, 1000);
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

            {transactionDetails && (
              <div className="border rounded-lg p-4 bg-gray-50">
                <h2 className="font-semibold mb-2">Transaction Details</h2>
                <div className="space-y-2 text-sm">
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

export default function BenefitResponsePage() {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/fd6745cd-3673-4b32-8e6c-a748b411f1f6',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pay/benefit/response/page.tsx:186',message:'BenefitResponsePage component rendered',data:{timestamp:Date.now(),pathname:window.location.pathname},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
  }
  // #endregion

  return (
    <Suspense fallback={
      <main className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </main>
    }>
      <BenefitResponsePageContent />
    </Suspense>
  );
}
