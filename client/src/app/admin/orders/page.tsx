'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/currency';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await api.get('/api/admin/orders');
      setOrders(response.data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await api.patch(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders(
        orders.map((order) => {
          const id = order._id || order.id || '';
          return id === orderId ? { ...order, status: newStatus as any } : order;
        })
      );
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Orders</h1>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4">Order ID</th>
                <th className="text-left py-3 px-4">Customer</th>
                <th className="text-left py-3 px-4">Total</th>
                <th className="text-left py-3 px-4">Payment</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const orderId = order._id || order.id || '';
                const userEmail = typeof order.user === 'object' && order.user !== null
                  ? (order.user as any).email
                  : typeof order.users === 'object' && order.users !== null
                  ? (order.users as any).email
                  : 'N/A';
                const createdAt = order.createdAt || order.created_at || '';
                const paymentStatus = order.paymentStatus || order.payment_status || 'unpaid';
                
                return (
                  <React.Fragment key={orderId}>
                    <tr className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{orderId ? orderId.slice(-8) : 'N/A'}</td>
                      <td className="py-3 px-4">{userEmail}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatPrice(order.total || 0, 'en-BH')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <select
                          value={order.status || 'pending'}
                          onChange={(e) => handleStatusUpdate(orderId, e.target.value)}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                            order.status || 'pending'
                          )}`}
                        >
                          <option value="pending">Pending</option>
                          <option value="processing">Processing</option>
                          <option value="shipped">Shipped</option>
                          <option value="delivered">Delivered</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() =>
                            setExpandedOrder(expandedOrder === orderId ? null : orderId)
                          }
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          {expandedOrder === orderId ? 'Hide' : 'View'} Details
                        </button>
                      </td>
                    </tr>
                    {expandedOrder === orderId && (
                      <tr>
                        <td colSpan={7} className="bg-gray-50 p-4">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <h4 className="font-semibold mb-2">Items</h4>
                              <div className="space-y-2">
                                {order.items && order.items.length > 0 ? (
                                  order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="text-sm">
                                      {item.name} x {item.quantity} -{' '}
                                      {formatPrice((item.price || 0) * (item.quantity || 0), 'en-BH')}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-sm text-gray-500">No items</p>
                                )}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-semibold mb-2">Shipping Address</h4>
                              {order.shippingAddress ? (
                                <p className="text-sm">
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
                              ) : (
                                <p className="text-sm text-gray-500">No shipping address</p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

