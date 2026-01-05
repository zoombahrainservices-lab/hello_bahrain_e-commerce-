'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { formatPrice } from '@/lib/currency';
import { api } from '@/lib/api';

declare global {
  interface Window {
    Checkout?: any;
    errorCallback?: (err: unknown) => void;
    cancelCallback?: () => void;
  }
}

type ShippingFormData = {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  country: string;
  postalCode: string;
  phone: string;
};

const SHIPPING_STORAGE_KEY = 'hb_shipping_address';

export default function PaymentPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, getTotal, clearCart } = useCart();
  const { language } = useLanguage();
  const router = useRouter();

  const [shipping, setShipping] = useState<ShippingFormData | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'benefit' | 'cod'>('card');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // Faster Checkout states
  const [savedTokens, setSavedTokens] = useState<Array<{
    id: string;
    card_alias: string | null;
    last_4_digits: string | null;
    card_type: string | null;
    is_default: boolean;
  }>>([]);
  const [useSavedCard, setUseSavedCard] = useState(false);
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(null);
  const [saveCard, setSaveCard] = useState(false);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Note: EazyPay Checkout now uses server-side invoice creation and redirect
  // No need to load Checkout.js script anymore

  // Load saved shipping info; guard routes
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/checkout');
      return;
    }

    if (items.length === 0) {
      router.push('/cart');
      return;
    }

    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem(SHIPPING_STORAGE_KEY) : null;
      if (!saved) {
        router.push('/checkout');
        return;
      }
      setShipping(JSON.parse(saved));
    } catch {
      router.push('/checkout');
    }
  }, [authLoading, user, items.length, router]);

  // Fetch saved tokens if feature is enabled and user is logged in
  useEffect(() => {
    const fetchSavedTokens = async () => {
      // Check if feature is enabled (frontend check)
      const featureEnabled = process.env.NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED === 'true';
      if (!featureEnabled || !user || paymentMethod !== 'benefit') {
        return;
      }

      try {
        setLoadingTokens(true);
        const response = await api.get('/api/payments/benefit/tokens');
        const tokens = response.data?.tokens || [];
        setSavedTokens(tokens);
        
        // Auto-select default token if available
        if (tokens.length > 0) {
          const defaultToken = tokens.find((t: any) => t.is_default) || tokens[0];
          setSelectedTokenId(defaultToken.id);
          setUseSavedCard(true);
        }
      } catch (error) {
        console.error('Error fetching saved tokens:', error);
        // Don't show error to user - feature is optional
      } finally {
        setLoadingTokens(false);
      }
    };

    if (user && paymentMethod === 'benefit') {
      fetchSavedTokens();
    } else {
      setSavedTokens([]);
      setUseSavedCard(false);
      setSelectedTokenId(null);
    }
  }, [user, paymentMethod]);

  const startOnlinePayment = async () => {
    try {
      const totalAmount = getTotal();
      if (!totalAmount || totalAmount <= 0) {
        setError('Invalid order total');
        return;
      }

      if (!shipping) {
        setError('Shipping address is required');
        return;
      }

      setSubmitting(true);

      // Create checkout session (NOT an order) for online payments
      // Order will be created only after payment success
      const sessionData = {
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          name: item.name,
          price: item.price,
          image: item.image,
        })),
        shippingAddress: shipping,
        total: totalAmount,
        paymentMethod: paymentMethod,
      };

      let sessionResponse;
      try {
        sessionResponse = await api.post('/api/checkout-sessions', sessionData);
      } catch (sessionError: any) {
        console.error('[Checkout] Session creation API error:', sessionError);
        const errorMsg = sessionError.response?.data?.message || sessionError.message || 'Failed to create checkout session';
        
        // Provide helpful error message for database issues
        if (errorMsg.includes('checkout_sessions') || errorMsg.includes('table') || errorMsg.includes('schema cache')) {
          throw new Error('Database table not found. Please contact support to set up checkout sessions.');
        }
        
        throw new Error(errorMsg);
      }
      
      if (!sessionResponse || !sessionResponse.data) {
        throw new Error('Failed to create checkout session: No response from server');
      }

      const sessionId = sessionResponse.data.sessionId;

      if (!sessionId) {
        const errorMsg = sessionResponse.data.message || 'Failed to create checkout session: No session ID returned';
        console.error('[Checkout] Session creation failed:', sessionResponse.data);
        throw new Error(errorMsg);
      }

      console.log('[Checkout] Created checkout session:', sessionId);

      // Route to appropriate payment gateway based on payment method
      let paymentUrl: string;

      if (paymentMethod === 'benefit') {
        // Check if using saved card (Faster Checkout)
        const featureEnabled = process.env.NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED === 'true';
        if (featureEnabled && useSavedCard && selectedTokenId) {
          // Use token-based payment (Faster Checkout)
          const paymentResponse = await api.post('/api/payments/benefit/init-with-token', {
            sessionId,
            amount: totalAmount,
            currency: 'BHD',
            tokenId: selectedTokenId,
          });

          paymentUrl = paymentResponse.data.paymentUrl;

          if (!paymentUrl) {
            throw new Error('No payment URL received from BENEFIT gateway');
          }
        } else {
          // Use regular BENEFIT Payment Gateway for BenefitPay
          const paymentResponse = await api.post('/api/payments/benefit/init', {
            sessionId,
            amount: totalAmount,
            currency: 'BHD',
          });

          paymentUrl = paymentResponse.data.paymentUrl;

          if (!paymentUrl) {
            throw new Error('No payment URL received from BENEFIT gateway');
          }
        }
      } else {
        // Use EazyPay for card payments
        const paymentResponse = await api.post('/api/payments/eazypay/create-invoice', {
          sessionId,
          amount: totalAmount,
          currency: 'BHD',
          description: `Checkout Session #${sessionId.substring(0, 8)}`,
        });

        paymentUrl = paymentResponse.data.paymentUrl;

        if (!paymentUrl) {
          throw new Error('No payment URL received from EazyPay');
        }
      }

      // Store session ID for return page (not order ID, since order doesn't exist yet)
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('pending_checkout_session_id', sessionId);
        // Remove old pending_order_id if exists
        window.localStorage.removeItem('pending_order_id');
      }

      // Redirect to payment gateway
      // Cart will NOT be cleared here - only after payment success
      window.location.href = paymentUrl;
    } catch (err: any) {
      console.error('Payment gateway error', err);
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      if (backendMessage) {
        setError(`Payment error: ${backendMessage}`);
      } else {
        setError(err?.message || 'Could not start payment. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping) return;
    setError('');

    // Validate stock again before finalizing
    const stockIssues = items.filter(
      (item) => item.stockQuantity !== undefined && item.quantity > item.stockQuantity
    );
    if (stockIssues.length > 0) {
      setError(
        `Some items exceed available stock: ${stockIssues.map((i) => i.name).join(', ')}. Please update your cart.`
      );
      return;
    }

    setSubmitting(true);

    try {
      if (paymentMethod === 'cod') {
        const orderData = {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
          shippingAddress: shipping,
          paymentMethod,
        };

        const response = await api.post('/api/orders', orderData);
        const order = response.data;
        const orderId = order?.id || order?._id;

        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SHIPPING_STORAGE_KEY);
          // Store recent order info for redirect detection
          localStorage.setItem('hb_recent_order', JSON.stringify({
            orderId: orderId || null,
            timestamp: Date.now(),
          }));
        }

        clearCart();
        // Redirect to order success page with order ID if available
        if (orderId) {
          // Dispatch event before redirect
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('orderPlaced', { 
              detail: { orderId } 
            }));
          }
          router.push(`/order/success?orderId=${orderId}`);
        } else {
          router.push('/order/success');
        }
      } else {
        await startOnlinePayment();
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create order';
      if (errorMsg.toLowerCase().includes('stock') || errorMsg.toLowerCase().includes('insufficient')) {
        setError(`${errorMsg}. Please update your cart and try again.`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !shipping || items.length === 0) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-2">Payment</h1>
        <p className="text-sm text-gray-600 mb-6">
          Choose how you&apos;d like to pay. Your data is processed securely as described in our{' '}
          <Link href="/privacy-policy" className="text-primary-600 hover:text-primary-700 underline">
            Privacy Policy
          </Link>
          .
        </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Payment + Shipping Summary */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Payment Method</h2>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleConfirm} className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center border rounded-lg px-4 py-3 cursor-pointer hover:border-primary-400 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={paymentMethod === 'card'}
                    onChange={() => setPaymentMethod('card')}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">BenefitPay</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard and other major cards.</p>
                  </div>
                </label>

                <label className="flex items-center border rounded-lg px-4 py-3 cursor-pointer hover:border-primary-400 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="benefit"
                    checked={paymentMethod === 'benefit'}
                    onChange={() => setPaymentMethod('benefit')}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500">Pay quickly using Bahrain&apos;s BenefitPay app.</p>
                  </div>
                </label>

                {/* Faster Checkout UI - Only show if feature enabled and BenefitPay selected */}
                {paymentMethod === 'benefit' && process.env.NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED === 'true' && (
                  <div className="ml-8 mt-2 space-y-3 border-l-2 border-primary-200 pl-4">
                    {/* Saved Cards Dropdown */}
                    {savedTokens.length > 0 && (
                      <div className="space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useSavedCard}
                            onChange={(e) => {
                              setUseSavedCard(e.target.checked);
                              if (!e.target.checked) {
                                setSelectedTokenId(null);
                              } else if (savedTokens.length > 0) {
                                const defaultToken = savedTokens.find(t => t.is_default) || savedTokens[0];
                                setSelectedTokenId(defaultToken.id);
                              }
                            }}
                            className="rounded"
                          />
                          <span className="text-sm font-medium">Use saved card</span>
                        </label>
                        
                        {useSavedCard && (
                          <select
                            value={selectedTokenId || ''}
                            onChange={(e) => setSelectedTokenId(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                            disabled={loadingTokens}
                          >
                            {savedTokens.map((token) => (
                              <option key={token.id} value={token.id}>
                                {token.card_alias || 
                                 (token.last_4_digits ? `Card ending in ${token.last_4_digits}` : 'Saved Card')}
                                {token.is_default ? ' (Default)' : ''}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                    )}

                    {/* Save Card Checkbox - Only show if not using saved card */}
                    {(!useSavedCard || savedTokens.length === 0) && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={saveCard}
                          onChange={(e) => setSaveCard(e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">Save card for faster checkout</span>
                      </label>
                    )}
                  </div>
                )}

                <label className="flex items-center border rounded-lg px-4 py-3 cursor-pointer hover:border-primary-400 transition">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="mr-3"
                  />
                  <div>
                    <p className="font-medium">Cash on Delivery (COD)</p>
                    <p className="text-xs text-gray-500">Pay in cash when your order is delivered.</p>
                  </div>
                </label>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-4 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
              >
                {submitting ? 'Placing Order...' : 'Confirm & Place Order'}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-4">Shipping Address</h2>
            <p className="text-sm text-gray-700">
              {shipping.fullName}
              <br />
              {shipping.addressLine1}
              {shipping.addressLine2 && (
                <>
                  <br />
                  {shipping.addressLine2}
                </>
              )}
              <br />
              {shipping.city}, {shipping.postalCode}
              <br />
              {shipping.country}
              <br />
              Phone: {shipping.phone}
            </p>
            <button
              type="button"
              onClick={() => router.push('/checkout')}
              className="mt-4 inline-flex items-center text-sm text-primary-600 hover:text-primary-700 underline"
            >
              Edit shipping details
            </button>
          </div>
        </div>

        {/* Order Summary */}
        <div>
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{item.name}</p>
                    <p className="text-gray-600 text-sm">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-semibold text-sm">
                    {formatPrice(item.price * item.quantity, language === 'ar' ? 'ar-BH' : 'en-BH')}
                  </p>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">
                  {formatPrice(getTotal(), language === 'ar' ? 'ar-BH' : 'en-BH')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping</span>
                <span className="font-semibold">Free</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span>{formatPrice(getTotal(), language === 'ar' ? 'ar-BH' : 'en-BH')}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


