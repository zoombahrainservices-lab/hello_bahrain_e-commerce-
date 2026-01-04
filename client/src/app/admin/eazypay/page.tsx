'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EazyPayAdminPage() {
  return (
    <div className="w-full overflow-x-hidden">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">EazyPay Portal</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/admin/eazypay/transactions"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-blue-100 p-4 rounded-lg">
              <span className="text-3xl">📋</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Live Transactions</h2>
              <p className="text-gray-600 text-sm">View and search transactions</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/eazypay/settlements"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-green-100 p-4 rounded-lg">
              <span className="text-3xl">💰</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Settlements</h2>
              <p className="text-gray-600 text-sm">View settlement reports</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/eazypay/vat"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-4 rounded-lg">
              <span className="text-3xl">📊</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">VAT Reports</h2>
              <p className="text-gray-600 text-sm">View VAT summaries</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/eazypay/disputes"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-red-100 p-4 rounded-lg">
              <span className="text-3xl">⚠️</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Disputes</h2>
              <p className="text-gray-600 text-sm">Manage chargebacks and disputes</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/eazypay/settlement-report"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-yellow-100 p-4 rounded-lg">
              <span className="text-3xl">📥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Download Reports</h2>
              <p className="text-gray-600 text-sm">Download PDF/CSV reports</p>
            </div>
          </div>
        </Link>

        <Link
          href="/admin/eazypay/transaction-lookup"
          className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-indigo-100 p-4 rounded-lg">
              <span className="text-3xl">🔍</span>
            </div>
            <div>
              <h2 className="text-xl font-bold">Transaction Lookup</h2>
              <p className="text-gray-600 text-sm">Find transaction by RRN & Auth Code</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}

