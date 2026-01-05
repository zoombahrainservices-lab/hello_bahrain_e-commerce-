'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/currency';

export default function OrdersClient() {
  const { user, loading: authLoading } = useAuth();
  const { language } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login?redirect=/profile/orders');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams?.get('success') === 'true') {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, [searchParams]);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/my');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  // Listen for order placed event
  useEffect(() => {
    if (!user) return;

    const handleOrderPlaced = (event: CustomEvent) => {
      // Refresh orders when new order is placed
      console.log('[Orders] Order placed event received:', event.detail);
      fetchOrders();
    };

    window.addEventListener('orderPlaced', handleOrderPlaced as EventListener);
    return () => {
      window.removeEventListener('orderPlaced', handleOrderPlaced as EventListener);
    };
  }, [user, fetchOrders]);

  // Refetch orders when page becomes visible or window gains focus
  useEffect(() => {
    if (!user) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('[Orders] Page became visible, refreshing orders');
        fetchOrders();
      }
    };

    const handleFocus = () => {
      console.log('[Orders] Window gained focus, refreshing orders');
      fetchOrders();
    };

    // Check for recent order marker in localStorage
    const checkRecentOrder = () => {
      try {
        const recentOrderStr = localStorage.getItem('hb_recent_order');
        if (recentOrderStr) {
          const recentOrder = JSON.parse(recentOrderStr);
          const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
          if (recentOrder.timestamp && recentOrder.timestamp > fiveMinutesAgo) {
            console.log('[Orders] Recent order detected, refreshing');
            fetchOrders();
            // Clear marker after use
            localStorage.removeItem('hb_recent_order');
          }
        }
      } catch (error) {
        console.error('[Orders] Error checking recent order:', error);
      }
    };

    // Check on mount
    checkRecentOrder();

    // Listen for visibility and focus changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [user, fetchOrders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-red-100 text-red-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadge = (paymentStatus: string, paymentMethod?: string) => {
    if (paymentStatus === 'paid') {
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">Paid</span>;
    }
    if (paymentStatus === 'unpaid') {
      if (paymentMethod === 'cod') {
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs font-medium">Awaiting Collection</span>;
      }
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">Payment Pending</span>;
    }
    if (paymentStatus === 'failed') {
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs font-medium">Failed</span>;
    }
    return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs font-medium">{paymentStatus || 'Unknown'}</span>;
  };

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
      </div>

      {showSuccess && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
          Order placed successfully!
        </div>
      )}

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No orders yet</p>
          <a
            href="/"
            className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
          >
            Start Shopping
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Order ID</p>
                  <p className="font-mono text-sm">{order._id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Date</p>
                  <p className="font-medium">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total</p>
                  <p className="font-bold text-lg">{formatPrice(order.total, language === 'ar' ? 'ar-BH' : 'en-BH')}</p>
                </div>
                <div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                      order.status
                    )}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>
                {order.paymentMethod && (
                  <div>
                    <p className="text-sm text-gray-500">Payment Method</p>
                    <p className="font-medium text-sm">
                      {order.paymentMethod === 'cod' 
                        ? 'Cash on Delivery' 
                        : order.paymentMethod === 'benefit' 
                        ? 'BenefitPay' 
                        : order.paymentMethod === 'card'
                        ? 'Credit/Debit Card'
                        : order.paymentMethod}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-500">Payment Status</p>
                  {getPaymentStatusBadge(order.paymentStatus, order.paymentMethod)}
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Items</h3>
                {order.items && order.items.length > 0 ? (
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span>
                          {item.name} x {item.quantity}
                        </span>
                        <span className="font-medium">
                          {formatPrice(item.price * item.quantity, language === 'ar' ? 'ar-BH' : 'en-BH')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 italic">No items found for this order. Please contact support.</p>
                )}
              </div>

              <div className="border-t mt-4 pt-4">
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-sm text-gray-700">
                  {order.shippingAddress.fullName}
                  <br />
                  {order.shippingAddress.addressLine1}
                  {order.shippingAddress.addressLine2 && (
                    <>
                      <br />
                      {order.shippingAddress.addressLine2}
                    </>
                  )}
                  <br />
                  {order.shippingAddress.city}, {order.shippingAddress.postalCode}
                  <br />
                  {order.shippingAddress.country}
                  <br />
                  Phone: {order.shippingAddress.phone}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



