'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';

function OrdersPageContent() {
  const { user, loading: authLoading } = useAuth();
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

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/orders/my');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
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

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">My Orders</h1>

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
          {orders.map((order) => {
            const orderId = order._id || (order as any).id || '';
            const createdAt = order.createdAt || (order as any).created_at || '';
            const status = order.status || 'pending';
            const paymentStatus = order.paymentStatus || (order as any).payment_status || 'unpaid';
            
            return (
              <div key={orderId} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex flex-wrap items-start justify-between mb-4 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Order ID</p>
                    <p className="font-mono text-sm">{orderId.slice(-8).toUpperCase()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date</p>
                    <p className="font-medium">
                      {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="font-bold text-lg">${order.total?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Status</p>
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(
                          status
                        )}`}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Payment</p>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          paymentStatus === 'paid'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Items ({order.items?.length || 0})</h3>
                  {order.items && order.items.length > 0 ? (
                    <div className="space-y-2">
                      {order.items.map((item: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span>
                            {item.name} x {item.quantity}
                          </span>
                          <span className="font-medium">
                            ${((item.price || 0) * (item.quantity || 0)).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No items found</p>
                  )}
                </div>

                {order.shippingAddress && (
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
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function OrdersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      }
    >
      <OrdersPageContent />
    </Suspense>
  );
}
