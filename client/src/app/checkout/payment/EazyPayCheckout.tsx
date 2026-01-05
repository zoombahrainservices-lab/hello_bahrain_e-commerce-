'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';

interface EazyPayCheckoutProps {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
  onError?: (error: string) => void;
}

/**
 * EazyPay Checkout Component
 * Handles invoice creation and redirects to EazyPay payment page
 */
export default function EazyPayCheckout({
  orderId,
  amount,
  currency = 'BHD',
  description,
  onError,
}: EazyPayCheckoutProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const initiatePayment = async () => {
    try {
      setLoading(true);

      // Create invoice
      const response = await api.post('/api/payments/eazypay/create-invoice', {
        orderId,
        amount,
        currency,
        description: description || `Order #${orderId}`,
      });

      const { paymentUrl } = response.data;

      if (!paymentUrl) {
        throw new Error('No payment URL received from server');
      }

      // Redirect to EazyPay payment page
      window.location.href = paymentUrl;
    } catch (error: any) {
      console.error('EazyPay checkout error:', error);
      const errorMessage =
        error.response?.data?.message || error.message || 'Failed to initiate payment';
      if (onError) {
        onError(errorMessage);
      } else {
        alert(errorMessage);
      }
      setLoading(false);
    }
  };

  return (
    <button
      onClick={initiatePayment}
      disabled={loading}
      className="w-full bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? 'Processing...' : 'Pay with Card or BenefitPay'}
    </button>
  );
}




