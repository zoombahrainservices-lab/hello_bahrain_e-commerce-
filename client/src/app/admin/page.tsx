'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Order } from '@/lib/types';
import { formatPrice } from '@/lib/currency';

interface Summary {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  productCount: number;
  recentOrders: Order[];
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/api/admin/summary');
      setSummary(response.data);
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      console.error('Error details:', error?.response?.data);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="text-center py-16">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <h3 className="text-red-800 font-semibold mb-2">Error Loading Dashboard</h3>
          <p className="text-red-600 text-sm mb-4">
            Unable to load dashboard data. Please check:
          </p>
          <ul className="text-red-600 text-sm text-left list-disc list-inside mb-4">
            <li>Environment variables are set correctly</li>
            <li>Database connection is working</li>
            <li>You have admin permissions</li>
          </ul>
          <button
            onClick={() => {
              setLoading(true);
              fetchSummary();
            }}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Dashboard</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Users</p>
              <p className="text-3xl font-bold mt-2">{summary.totalUsers}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <span className="text-3xl">👥</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Orders</p>
              <p className="text-3xl font-bold mt-2">{summary.totalOrders}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <span className="text-3xl">🛒</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-3xl font-bold mt-2">
                {formatPrice(summary.totalRevenue, 'en-BH')}
              </p>
            </div>
            <div className="bg-yellow-100 p-3 rounded-lg">
              <span className="text-3xl">💰</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Products</p>
              <p className="text-3xl font-bold mt-2">{summary.productCount}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <span className="text-3xl">📦</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-bold mb-4">Recent Orders</h2>
        {summary.recentOrders.length === 0 ? (
          <p className="text-gray-500">No orders yet</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Order ID</th>
                  <th className="text-left py-3 px-4">Customer</th>
                  <th className="text-left py-3 px-4">Total</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {summary.recentOrders.map((order) => {
                  const orderId = order._id || order.id || '';
                  const userEmail = typeof order.user === 'object' && order.user !== null
                    ? (order.user as any).email
                    : typeof order.users === 'object' && order.users !== null
                    ? (order.users as any).email
                    : 'N/A';
                  const createdAt = order.createdAt || order.created_at || '';
                  
                  return (
                    <tr key={orderId} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 font-mono text-sm">{orderId.slice(-8)}</td>
                      <td className="py-3 px-4">{userEmail}</td>
                      <td className="py-3 px-4 font-semibold">
                        {formatPrice(order.total, 'en-BH')}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`px-2 py-1 rounded-full text-xs ${
                            order.status === 'delivered'
                              ? 'bg-green-100 text-green-800'
                              : order.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm">
                        {createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

