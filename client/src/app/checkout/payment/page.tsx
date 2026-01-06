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
    jQuery?: any;
    $?: any;
    InApp?: {
      open: (
        params: any,
        successCb: (result: any) => void,
        errorCb: (error: any) => void,
        closeCb: () => void
      ) => void;
    };
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
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'benefitpay_wallet' | 'cod'>('card');
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
  
  // Wallet payment states
  const [walletProcessing, setWalletProcessing] = useState(false);
  const [walletPolling, setWalletPolling] = useState(false);
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [walletError, setWalletError] = useState<{
    message: string;
    sessionId?: string;
    referenceAttempt?: number;
    canRetry?: boolean;
  } | null>(null);
  const [manualCheckLoading, setManualCheckLoading] = useState(false);
  
  // Wallet configuration check
  const [walletConfigured, setWalletConfigured] = useState<boolean | null>(null);
  const [walletConfigError, setWalletConfigError] = useState<string | null>(null);

  // Note: EazyPay Checkout now uses server-side invoice creation and redirect
  // No need to load Checkout.js script anymore
  
  // Check wallet configuration on mount
  useEffect(() => {
    const checkWalletConfig = async () => {
      try {
        console.log('[Wallet Config] Checking BenefitPay Wallet configuration...');
        const response = await api.get('/api/payments/benefitpay/check-config');
        const data = response.data;
        
        setWalletConfigured(data.configured);
        
        if (!data.configured) {
          const missingVars = data.missing || [];
          console.warn('[Wallet Config] BenefitPay Wallet not configured. Missing:', missingVars);
          setWalletConfigError(
            missingVars.length > 0 
              ? `Missing configuration: ${missingVars.join(', ')}`
              : 'BenefitPay Wallet is not configured'
          );
        } else {
          console.log('[Wallet Config] ✓ BenefitPay Wallet is configured');
          setWalletConfigError(null);
        }
      } catch (error: any) {
        console.error('[Wallet Config] Error checking configuration:', error);
        setWalletConfigured(false);
        setWalletConfigError('Unable to verify BenefitPay Wallet configuration');
      }
    };

    checkWalletConfig();
  }, []);
  
  // Load jQuery and BenefitPay Wallet SDK when needed
  useEffect(() => {
    if (paymentMethod === 'benefitpay_wallet' && !sdkLoaded) {
      // Check if jQuery is already loaded
      const loadJQuery = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          if (window.jQuery) {
            console.log('[Wallet SDK] jQuery already loaded');
            resolve();
            return;
          }

          const jqueryScript = document.createElement('script');
          jqueryScript.src = 'https://code.jquery.com/jquery-3.6.0.min.js';
          jqueryScript.async = true;
          jqueryScript.onload = () => {
            console.log('[Wallet SDK] jQuery loaded successfully');
            resolve();
          };
          jqueryScript.onerror = () => {
            console.error('[Wallet SDK] Failed to load jQuery');
            reject(new Error('Failed to load jQuery'));
          };
          document.head.appendChild(jqueryScript);
        });
      };

      // Load SDK after jQuery
      const loadSDK = (): Promise<void> => {
        return new Promise((resolve, reject) => {
          // Check if SDK is already loaded
          if (window.InApp) {
            console.log('[Wallet SDK] SDK already loaded');
            resolve();
            return;
          }

          const sdkScript = document.createElement('script');
          sdkScript.src = '/InApp.min.js';
          sdkScript.async = true;
          sdkScript.onload = () => {
            console.log('[Wallet SDK] SDK script loaded');
            // Wait for InApp to be available (it's initialized in $(document).ready)
            const checkInApp = setInterval(() => {
              if (window.InApp && window.jQuery) {
                console.log('[Wallet SDK] SDK initialized successfully');
                clearInterval(checkInApp);
                setSdkLoaded(true);
                resolve();
              }
            }, 100);

            // Timeout after 5 seconds
            setTimeout(() => {
              clearInterval(checkInApp);
              if (!window.InApp) {
                reject(new Error('SDK failed to initialize'));
              }
            }, 5000);
          };
          sdkScript.onerror = () => {
            console.error('[Wallet SDK] Failed to load SDK script');
            reject(new Error('Failed to load BenefitPay SDK'));
          };
          document.body.appendChild(sdkScript);
        });
      };

      // Load jQuery first, then SDK
      loadJQuery()
        .then(() => loadSDK())
        .then(() => {
          console.log('[Wallet SDK] Both jQuery and SDK loaded successfully');
        })
        .catch((err) => {
          console.error('[Wallet SDK] Loading error:', err);
          setError('Failed to load BenefitPay SDK. Please refresh the page and try again.');
        });
    }
  }, [paymentMethod, sdkLoaded]);

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

  // Fetch saved tokens if feature is enabled and user is logged in (for card/BENEFIT PG)
  useEffect(() => {
    const fetchSavedTokens = async () => {
      // Check if feature is enabled (frontend check)
      const featureEnabled = process.env.NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED === 'true';
      if (!featureEnabled || !user || paymentMethod !== 'card') {
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

    if (user && paymentMethod === 'card') {
      fetchSavedTokens();
    } else {
      setSavedTokens([]);
      setUseSavedCard(false);
      setSelectedTokenId(null);
    }
  }, [user, paymentMethod]);

  // Wallet payment flow with SDK
  const handleWalletPayment = async (sessionId: string, totalAmount: number) => {
    try {
      setWalletProcessing(true);
      setError('');
      setWalletError(null); // Clear previous wallet errors

      // Step 1: Call backend to get signed parameters
      console.log('[Wallet] Initializing wallet payment...');
      const initResponse = await api.post('/api/payments/benefitpay/init', {
        sessionId,
        showResult: true,
        hideMobileQR: false,
        qr_timeout: 150000, // 2.5 minutes in milliseconds
      });

      const { signedParams, referenceNumber } = initResponse.data;

      if (!signedParams || !referenceNumber) {
        throw new Error('Failed to initialize BenefitPay Wallet payment');
      }

      console.log('[Wallet] Signed parameters received, opening SDK...');

      // Step 2: Log exact parameters being sent to SDK (for debugging)
      console.log('[BenefitPay] InApp params (exact payload):', JSON.stringify(signedParams, null, 2));
      console.log('[BenefitPay] InApp params verification:');
      console.log('[BenefitPay] - merchantId:', signedParams.merchantId, '(expected: 3186 from EAZYPAY_MERCHANT_ID)');
      console.log('[BenefitPay] - appId:', signedParams.appId, '(expected: 1988588907)');
      console.log('[BenefitPay] - transactionAmount:', signedParams.transactionAmount, '(should be string like "2.000")');
      console.log('[BenefitPay] - transactionCurrency:', signedParams.transactionCurrency, '(should be exactly "BHD")');
      console.log('[BenefitPay] - referenceNumber:', signedParams.referenceNumber);
      console.log('[BenefitPay] - secure_hash present:', !!signedParams.secure_hash);
      console.log('[BenefitPay] - secure_hash length:', signedParams.secure_hash?.length || 0);

      // Step 3: Open InApp SDK
      if (!window.InApp || !window.jQuery) {
        throw new Error('BenefitPay Wallet SDK is still loading. Please wait a moment and try again.');
      }

      // Log timestamp when InApp.open() is called
      const openCalledAt = new Date().toISOString();
      console.log('[Wallet] InApp.open() called at:', openCalledAt);
      
      // Update session with open_called_at timestamp and state
      try {
        await Promise.all([
          api.post('/api/checkout-sessions/update-wallet-timestamp', {
            sessionId,
            timestampType: 'open_called_at',
            timestamp: openCalledAt,
          }),
          api.post('/api/checkout-sessions/update-wallet-state', {
            sessionId,
            state: 'WALLET_POPUP_OPENED',
          }),
        ]);
      } catch (err) {
        console.warn('[Wallet] Failed to log open_called_at timestamp or state:', err);
      }

      window.InApp.open(
        signedParams,
        // Success callback - SDK success does NOT mean payment success
        async (result: any) => {
          const callbackReturnedAt = new Date().toISOString();
          console.log('[Wallet] SDK success callback received at:', callbackReturnedAt);
          console.log('[Wallet] SDK success callback:', result);
          console.log('[Wallet] SDK success callback (full):', JSON.stringify(result, null, 2));
          
          // Log callback timestamp
          try {
            await api.post('/api/checkout-sessions/update-wallet-timestamp', {
              sessionId,
              timestampType: 'callback_returned_at',
              timestamp: callbackReturnedAt,
            });
          } catch (err) {
            console.warn('[Wallet] Failed to log callback_returned_at timestamp:', err);
          }
          
          setWalletProcessing(false);
          // Start polling for payment status
          await pollPaymentStatus(referenceNumber, sessionId);
        },
        // Error callback - Enhanced logging and UI
        (error: any) => {
          const callbackReturnedAt = new Date().toISOString();
          console.error('[Wallet] SDK error callback received at:', callbackReturnedAt);
          console.error('[Wallet] SDK error callback:', error);
          console.error('[Wallet] SDK error callback (full):', JSON.stringify(error, null, 2));
          if (error?.errorCode) {
            console.error('[BenefitPay] Error Code:', error.errorCode);
          }
          if (error?.errorDescription) {
            console.error('[BenefitPay] Error Description:', error.errorDescription);
          }
          if (error?.message) {
            console.error('[BenefitPay] Error Message:', error.message);
          }
          
          // Log callback timestamp and state
          try {
            Promise.all([
              api.post('/api/checkout-sessions/update-wallet-timestamp', {
                sessionId,
                timestampType: 'callback_returned_at',
                timestamp: callbackReturnedAt,
              }),
              api.post('/api/checkout-sessions/update-wallet-state', {
                sessionId,
                state: 'SDK_CALLBACK_ERROR',
              }),
            ]).catch((err) => console.warn('[Wallet] Failed to log callback_returned_at timestamp or state:', err));
          } catch (err) {
            console.warn('[Wallet] Failed to log callback_returned_at timestamp or state:', err);
          }
          
          setWalletProcessing(false);
          
          let errorMsg = error?.errorDescription || error?.message || 'BenefitPay Wallet payment failed';
          
          // Check for specific error codes and provide helpful messages
          if (errorMsg.includes('Merchant does not support payment') || 
              errorMsg.includes('FOO-003') ||
              error?.errorCode === 'FOO-003') {
            errorMsg = 'Merchant account is not enabled for BenefitPay Wallet payments. ' +
                      'Please contact BenefitPay support to activate wallet payments for your merchant account (Merchant ID: 3186, App ID: 1988588907). ' +
                      'This is not a localhost issue - the account needs to be activated in BenefitPay\'s system.';
            console.error('[BenefitPay] FOO-003 Error: Merchant account not enabled for wallet payments');
            console.error('[BenefitPay] Action Required: Contact BenefitPay support to activate wallet payments');
          } else if (errorMsg.includes('Reference number is already used') ||
                     errorMsg.includes('FOO-002') ||
                     error?.errorCode === 'FOO-002') {
            errorMsg = 'This payment reference has already been used. Please try again - a new reference will be generated automatically.';
            console.error('[BenefitPay] FOO-002 Error: Duplicate reference number');
            console.error('[BenefitPay] Action: Retry will generate a new reference number');
            // Allow retry for FOO-002
            canRetry = true;
          }
          
          // Get session info from init response
          const maskedSessionId = sessionId ? `***${sessionId.substring(sessionId.length - 6)}` : 'unknown';
          const referenceAttempt = initResponse?.data?.referenceAttempt || 1;
          
          // Set wallet-specific error with retry capability
          setWalletError({
            message: errorMsg,
            sessionId: maskedSessionId,
            referenceAttempt,
            canRetry: !errorMsg.includes('not enabled'), // Don't allow retry if account not enabled
          });
        },
        // Close callback
        async () => {
          const callbackReturnedAt = new Date().toISOString();
          console.log('[Wallet] SDK close callback received at:', callbackReturnedAt);
          
          // Log callback timestamp
          try {
            await api.post('/api/checkout-sessions/update-wallet-timestamp', {
              sessionId,
              timestampType: 'callback_returned_at',
              timestamp: callbackReturnedAt,
            });
          } catch (err) {
            console.warn('[Wallet] Failed to log callback_returned_at timestamp:', err);
          }
          
          setWalletProcessing(false);
          // Check status once in case payment was completed before close
          try {
            await checkPaymentStatus(referenceNumber, sessionId, false);
          } catch (err) {
            console.log('[Wallet] Payment cancelled or incomplete');
          }
        }
      );
    } catch (err: any) {
      console.error('[Wallet] Payment error:', err);
      setWalletProcessing(false);
      
      const errorResponse = err.response?.data;
      const errorCode = errorResponse?.error;
      const errorMessage = errorResponse?.message || err.message;
      const errorDetails = errorResponse?.details;
      
      console.error('[Wallet] Error details:', {
        errorCode,
        errorMessage,
        errorDetails,
        fullResponse: errorResponse,
      });
      
      // Handle specific error codes
      let errorMsg = 'BenefitPay Wallet payment failed';
      let canRetry = true;
      
      if (errorCode === 'BENEFITPAY_CREDENTIALS_MISSING') {
        errorMsg = 'BenefitPay Wallet is not properly configured. Please contact support.';
        canRetry = false;
        
        // Log missing credentials for debugging
        if (errorDetails?.missingEnvVars && Array.isArray(errorDetails.missingEnvVars)) {
          console.error('[Wallet] Missing environment variables:', errorDetails.missingEnvVars.join(', '));
          
          // In development, show more details
          if (process.env.NODE_ENV === 'development') {
            errorMsg += ` (Missing: ${errorDetails.missingEnvVars.join(', ')})`;
          }
        }
      } else if (errorCode === 'BENEFITPAY_SESSION_NOT_FOUND') {
        errorMsg = 'Checkout session not found. Please try again from the cart.';
        canRetry = false;
      } else if (errorCode === 'BENEFITPAY_INVALID_SESSION_STATUS') {
        errorMsg = 'This checkout session is no longer valid. Please start a new checkout.';
        canRetry = false;
      } else if (errorCode === 'BENEFITPAY_SESSION_UPDATE_FAILED') {
        errorMsg = 'Failed to save payment information. Please try again.';
        canRetry = true;
      } else if (errorCode === 'BENEFITPAY_INIT_FAILED') {
        errorMsg = errorMessage || 'Failed to initialize payment. Please try again.';
        canRetry = true;
      } else if (errorMessage) {
        // Generic error with message from backend
        if (errorMessage.includes('credentials')) {
          errorMsg = 'BenefitPay Wallet is not properly configured. Please contact support.';
          canRetry = false;
        } else {
          errorMsg = `BenefitPay Wallet: ${errorMessage}`;
          canRetry = true;
        }
      }
      
      setWalletError({
        message: errorMsg,
        canRetry,
      });
    }
  };

  // Manual status check (Phase 6.2)
  const handleManualStatusCheck = async () => {
    if (!walletError || manualCheckLoading) return;
    
    try {
      setManualCheckLoading(true);
      setError('');
      
      // Get sessionId from localStorage
      const pendingSessionId = typeof window !== 'undefined' 
        ? window.localStorage.getItem('pending_checkout_session_id')
        : null;
      
      if (!pendingSessionId) {
        setError('No pending payment session found');
        setManualCheckLoading(false);
        return;
      }

      console.log('[Wallet] Manual status check for session:', pendingSessionId);
      
      // Get reference number from session (need to call init again to get it)
      // Or we could store it in state during handleWalletPayment
      // For now, we'll just call check-status which will handle it
      
      // Note: We can't call check-status directly without referenceNumber
      // So we need to store referenceNumber in state during init
      setError('Manual check not yet implemented - please check your orders page');
      setManualCheckLoading(false);
      
    } catch (err: any) {
      console.error('[Wallet] Manual check error:', err);
      setError(err.response?.data?.message || 'Failed to check payment status');
      setManualCheckLoading(false);
    }
  };

  // Check payment status with backend
  const checkPaymentStatus = async (referenceNumber: string, sessionId: string, showErrors = true): Promise<boolean> => {
    try {
      const statusResponse = await api.post('/api/payments/benefitpay/check-status', {
        referenceNumber,
        sessionId,
      });

      const { success, orderId, status, reason } = statusResponse.data;

      if (success && orderId) {
        console.log('[Wallet] Payment successful, order created:', orderId);
        // Clear cart
        clearCart();
        // Redirect to success page
        router.push(`/profile/orders?orderId=${orderId}`);
        return true;
      } else if (status === 'failed') {
        if (showErrors) {
          setError(reason || 'Payment failed. Your cart is intact.');
        }
        return false;
      } else {
        // Pending or not found
        console.log('[Wallet] Payment status:', status, reason);
        return false;
      }
    } catch (err: any) {
      console.error('[Wallet] Status check error:', err);
      if (showErrors) {
        const errorMsg = err.response?.data?.message || err.message || 'Failed to check payment status';
        setError(errorMsg);
      }
      return false;
    }
  };

  // Poll payment status (for delayed payments)
  const pollPaymentStatus = async (referenceNumber: string, sessionId: string) => {
    setWalletPolling(true);
    const maxAttempts = 30; // 30 attempts * 3 seconds = 90 seconds max
    let attempts = 0;
    let firstCheckLogged = false;

    const poll = async () => {
      attempts++;
      console.log(`[Wallet] Polling attempt ${attempts}/${maxAttempts}`);

      // Log first check-status timestamp and state
      if (!firstCheckLogged && attempts === 1) {
        const firstCheckAt = new Date().toISOString();
        console.log('[Wallet] First check-status call at:', firstCheckAt);
        try {
          await Promise.all([
            api.post('/api/checkout-sessions/update-wallet-timestamp', {
              sessionId,
              timestampType: 'first_check_status_at',
              timestamp: firstCheckAt,
            }),
            api.post('/api/checkout-sessions/update-wallet-state', {
              sessionId,
              state: 'PENDING_STATUS_CHECK',
            }),
          ]);
        } catch (err) {
          console.warn('[Wallet] Failed to log first_check_status_at timestamp or state:', err);
        }
        firstCheckLogged = true;
      }

      const success = await checkPaymentStatus(referenceNumber, sessionId, false);

      if (success) {
        setWalletPolling(false);
        return;
      }

      if (attempts >= maxAttempts) {
        setWalletPolling(false);
        
        console.log('[Wallet] Polling timeout reached (90 seconds), performing final check-status...');
        
        // Call final check-status once more before giving up
        try {
          const finalCheck = await checkPaymentStatus(referenceNumber, sessionId, false);
          if (finalCheck) {
            // Payment succeeded on final check
            console.log('[Wallet] Payment confirmed on final check-status');
            return;
          }
        } catch (err) {
          console.log('[Wallet] Final check-status failed:', err);
        }
        
        // Log timeout state after final check
        try {
          await api.post('/api/checkout-sessions/update-wallet-state', {
            sessionId,
            state: 'EXPIRED',
          });
        } catch (err) {
          console.warn('[Wallet] Failed to update state to EXPIRED:', err);
        }
        
        // Get session info for display
        const maskedSessionId = sessionId ? `***${sessionId.substring(sessionId.length - 6)}` : 'unknown';
        
        setWalletError({
          message: 'Payment status is taking longer than expected. The payment may still be processing. You can check your orders page or try again.',
          sessionId: maskedSessionId,
          canRetry: true, // Allow retry after timeout
        });
        return;
      }

      // Poll again after 3 seconds
      setTimeout(poll, 3000);
    };

    poll();
  };

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
      if (paymentMethod === 'benefitpay_wallet') {
        // Use BenefitPay Wallet SDK (in-app payment)
        setSubmitting(false); // Reset submitting state for wallet flow
        await handleWalletPayment(sessionId, totalAmount);
        return; // Don't redirect, wallet handles its own flow
      }
      
      // For card payments, use BENEFIT Payment Gateway (old BenefitPay PG)
      let paymentUrl: string;
      
      if (paymentMethod === 'card') {
        // Use BENEFIT Payment Gateway for card payments (moved from old 'benefit' option)
        // Check if using saved card (Faster Checkout)
        const featureEnabled = process.env.NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED === 'true';
        let paymentResponse;
        
        if (featureEnabled && useSavedCard && selectedTokenId) {
          // Use token-based payment (Faster Checkout)
          paymentResponse = await api.post('/api/payments/benefit/init-with-token', {
            sessionId,
            amount: totalAmount,
            currency: 'BHD',
            tokenId: selectedTokenId,
          });
        } else {
          // Use regular BENEFIT Payment Gateway
          paymentResponse = await api.post('/api/payments/benefit/init', {
            sessionId,
            amount: totalAmount,
            currency: 'BHD',
          });
        }

        paymentUrl = paymentResponse.data.paymentUrl;

        if (!paymentUrl) {
          throw new Error('No payment URL received from BENEFIT gateway');
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
      } else {
        throw new Error('Invalid payment method');
      }
    } catch (err: any) {
      console.error('Payment gateway error', err);
      const backendMessage = err.response?.data?.message || err.response?.data?.error;
      
      // Make sure error messages are specific to the payment method
      if (paymentMethod === 'card') {
        // EazyPay error
        if (backendMessage) {
          setError(`Payment error: ${backendMessage}`);
        } else {
          setError(err?.message || 'Could not start payment. Please try again.');
        }
      } else {
        // Should not reach here for wallet (it has its own error handling)
        setError(err?.message || 'Could not start payment. Please try again.');
      }
      setSubmitting(false);
    }
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping) return;
    setError('');

    // Validate wallet configuration if wallet payment is selected
    if (paymentMethod === 'benefitpay_wallet' && walletConfigured === false) {
      setError('BenefitPay Wallet is currently unavailable. Please select a different payment method or contact support.');
      return;
    }

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

            {/* Wallet-specific error display (Phase 6.1) */}
            {walletError && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className="text-sm font-medium text-amber-800">Payment Error</h3>
                    <p className="mt-1 text-sm text-amber-700">{walletError.message}</p>
                    {walletError.sessionId && (
                      <p className="mt-1 text-xs text-amber-600">
                        Session: {walletError.sessionId}
                        {walletError.referenceAttempt && ` (Attempt ${walletError.referenceAttempt})`}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      {walletError.canRetry && (
                        <button
                          type="button"
                          onClick={() => {
                            setWalletError(null);
                            setError('');
                            // Trigger retry by submitting form again
                            const form = document.querySelector('form');
                            if (form) form.requestSubmit();
                          }}
                          className="text-sm font-medium text-amber-800 hover:text-amber-900 underline"
                        >
                          Retry Payment
                        </button>
                      )}
                      {!walletError.canRetry && (
                        <button
                          type="button"
                          onClick={handleManualStatusCheck}
                          disabled={manualCheckLoading}
                          className="text-sm font-medium text-amber-800 hover:text-amber-900 underline disabled:opacity-50"
                        >
                          {manualCheckLoading ? 'Checking...' : 'Check Status'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setWalletError(null)}
                        className="text-sm font-medium text-amber-600 hover:text-amber-700"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </div>
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
                    <p className="font-medium">Credit / Debit Card</p>
                    <p className="text-xs text-gray-500">Visa, Mastercard and other major cards.</p>
                  </div>
                </label>

                <label className={`flex items-center border rounded-lg px-4 py-3 transition ${
                  walletConfigured === false 
                    ? 'opacity-50 cursor-not-allowed bg-gray-50' 
                    : 'cursor-pointer hover:border-primary-400'
                }`}>
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="benefitpay_wallet"
                    checked={paymentMethod === 'benefitpay_wallet'}
                    onChange={() => setPaymentMethod('benefitpay_wallet')}
                    disabled={walletConfigured === false}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <p className="font-medium">BenefitPay</p>
                    <p className="text-xs text-gray-500">Pay quickly using Bahrain&apos;s BenefitPay app.</p>
                    {walletConfigured === false && (
                      <p className="text-xs text-red-600 mt-1">
                        ⚠️ Currently unavailable. Please contact support.
                      </p>
                    )}
                    {walletConfigured === null && (
                      <p className="text-xs text-gray-400 mt-1">
                        Checking availability...
                      </p>
                    )}
                  </div>
                </label>

                {/* Faster Checkout UI - Only show if feature enabled and Card (BENEFIT PG) selected */}
                {paymentMethod === 'card' && process.env.NEXT_PUBLIC_BENEFIT_FASTER_CHECKOUT_ENABLED === 'true' && (
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
                disabled={submitting || walletProcessing || walletPolling}
                className="w-full mt-4 bg-primary-600 text-white py-3 rounded-lg font-semibold hover:bg-primary-700 transition disabled:opacity-50"
              >
                {walletPolling
                  ? 'Verifying Payment...'
                  : walletProcessing
                  ? 'Opening Wallet...'
                  : submitting
                  ? 'Placing Order...'
                  : 'Confirm & Place Order'}
              </button>
              
              {walletPolling && (
                <div className="mt-3 text-center text-sm text-gray-600">
                  <p>Checking payment status... This may take up to 90 seconds.</p>
                  <p className="mt-1">Please do not close this page.</p>
                </div>
              )}
              
              {paymentMethod === 'benefitpay_wallet' && !sdkLoaded && (
                <div className="mt-3 text-center text-sm text-yellow-600">
                  Loading BenefitPay SDK...
                </div>
              )}
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


