'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/currency';
import Link from 'next/link';

interface Transaction {
  tranType: string;
  tranTypeCode: string;
  responseDescription: string;
  transactionTime: string;
  terminalPublicId: string;
  authCode: string;
  amount: string;
  cardNo: string;
  terminalName: string;
  bankLogo: string;
  approveTime: string;
  approveNumber: string;
  rrn: string;
  stan: string;
  responseCode: string;
  id: number;
  terminalCcy: string;
  merchantName: string;
  posEntryMode: string;
  bankName: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [size, setSize] = useState(20);
  const [filters, setFilters] = useState({
    id: '',
    terminalId: '',
    cardNo: '',
    terminalName: '',
  });
  const [totalCount, setTotalCount] = useState(0);
  const [expandedTransaction, setExpandedTransaction] = useState<number | null>(null);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/api/admin/eazypay/transactions', {
        page: String(page),
        size: String(size),
        ...(filters.id && { id: filters.id }),
        ...(filters.terminalId && { terminalId: filters.terminalId }),
        ...(filters.cardNo && { cardNo: filters.cardNo }),
        ...(filters.terminalName && { terminalName: filters.terminalName }),
      });

      const data = response.data;
      if (data?.result?.isSuccess && data?.data?.[0]?.list) {
        setTransactions(data.data[0].list);
        setTotalCount(data.data[0].count || 0);
      } else {
        setTransactions([]);
        setTotalCount(0);
        if (data?.result && !data.result.isSuccess) {
          setError(data.result.description || 'No transactions found');
        }
      }
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      setError(error.response?.data?.message || 'Failed to fetch transactions. Please check your EazyPay credentials.');
      setTransactions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, size]);

  const handleFilter = () => {
    setPage(1);
    fetchTransactions();
  };

  const clearFilters = () => {
    setFilters({
      id: '',
      terminalId: '',
      cardNo: '',
      terminalName: '',
    });
    setPage(1);
    setTimeout(() => fetchTransactions(), 100);
  };

  const maskCardNumber = (cardNo: string) => {
    if (!cardNo) return '';
    return cardNo.replace(/(\d{4})\d+(\d{4})/, '$1******$2');
  };

  const getStatusBadge = (responseCode: string, responseDescription: string) => {
    const isSuccess = responseCode === '00' || responseCode === '0' || responseCode === '200';
    return (
      <span
        className={`px-2 py-1 rounded text-xs font-medium ${
          isSuccess
            ? 'bg-green-100 text-green-800'
            : 'bg-red-100 text-red-800'
        }`}
      >
        {responseDescription || `Code: ${responseCode}`}
      </span>
    );
  };

  return (
    <div className="w-full overflow-x-hidden">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">EazyPay Transactions</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchTransactions}
            disabled={loading}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition disabled:opacity-50 flex items-center gap-2"
          >
            <span>🔄</span>
            Refresh
          </button>
          <Link
            href="/admin/eazypay"
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition"
          >
            ← Back
          </Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Clear All
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Transaction ID</label>
            <input
              type="text"
              value={filters.id}
              onChange={(e) => setFilters({ ...filters, id: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Transaction ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Terminal ID</label>
            <input
              type="text"
              value={filters.terminalId}
              onChange={(e) => setFilters({ ...filters, terminalId: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Terminal ID"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Card Number</label>
            <input
              type="text"
              value={filters.cardNo}
              onChange={(e) => setFilters({ ...filters, cardNo: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Card Number"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Terminal Name</label>
            <input
              type="text"
              value={filters.terminalName}
              onChange={(e) => setFilters({ ...filters, terminalName: e.target.value })}
              onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
              className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Terminal Name"
            />
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleFilter}
            disabled={loading}
            className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition disabled:opacity-50"
          >
            Apply Filters
          </button>
          <select
            value={size}
            onChange={(e) => {
              setSize(Number(e.target.value));
              setPage(1);
            }}
            className="border rounded-lg px-3 py-2"
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
          </select>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <span className="text-red-600 mr-2">⚠️</span>
            <p className="text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 mb-4">No transactions found</p>
            {!error && (
              <button
                onClick={fetchTransactions}
                className="text-primary-600 hover:text-primary-700 underline"
              >
                Refresh
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Type</th>
                    <th className="text-left py-3 px-4 font-semibold">Time</th>
                    <th className="text-left py-3 px-4 font-semibold">Amount</th>
                    <th className="text-left py-3 px-4 font-semibold">Card</th>
                    <th className="text-left py-3 px-4 font-semibold">Terminal</th>
                    <th className="text-left py-3 px-4 font-semibold">RRN</th>
                    <th className="text-left py-3 px-4 font-semibold">Auth Code</th>
                    <th className="text-left py-3 px-4 font-semibold">Status</th>
                    <th className="text-left py-3 px-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((txn) => (
                    <>
                      <tr
                        key={txn.id}
                        className="border-t hover:bg-gray-50 cursor-pointer"
                        onClick={() =>
                          setExpandedTransaction(
                            expandedTransaction === txn.id ? null : txn.id
                          )
                        }
                      >
                        <td className="py-3 px-4 font-mono text-sm">{txn.id}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {txn.tranType}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm">
                          {new Date(txn.transactionTime).toLocaleString()}
                        </td>
                        <td className="py-3 px-4 font-semibold">
                          {formatPrice(parseFloat(txn.amount), 'en-BH')} {txn.terminalCcy}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">
                          {maskCardNumber(txn.cardNo)}
                        </td>
                        <td className="py-3 px-4 text-sm">
                          <div>{txn.terminalPublicId}</div>
                          {txn.terminalName && (
                            <div className="text-xs text-gray-500">{txn.terminalName}</div>
                          )}
                        </td>
                        <td className="py-3 px-4 font-mono text-sm">{txn.rrn || '-'}</td>
                        <td className="py-3 px-4 font-mono text-sm">{txn.authCode || '-'}</td>
                        <td className="py-3 px-4">
                          {getStatusBadge(txn.responseCode, txn.responseDescription)}
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedTransaction(
                                expandedTransaction === txn.id ? null : txn.id
                              );
                            }}
                            className="text-primary-600 hover:text-primary-700 text-sm"
                          >
                            {expandedTransaction === txn.id ? '▼' : '▶'} Details
                          </button>
                        </td>
                      </tr>
                      {expandedTransaction === txn.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={10} className="px-4 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-semibold text-gray-600">Merchant:</span>
                                <p>{txn.merchantName || '-'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-600">Bank:</span>
                                <p>{txn.bankName || '-'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-600">Entry Mode:</span>
                                <p>{txn.posEntryMode || '-'}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-600">STAN:</span>
                                <p>{txn.stan || '-'}</p>
                              </div>
                              {txn.approveTime && (
                                <div>
                                  <span className="font-semibold text-gray-600">Approve Time:</span>
                                  <p>{new Date(txn.approveTime).toLocaleString()}</p>
                                </div>
                              )}
                              {txn.approveNumber && (
                                <div>
                                  <span className="font-semibold text-gray-600">Approve Number:</span>
                                  <p>{txn.approveNumber}</p>
                                </div>
                              )}
                              <div>
                                <span className="font-semibold text-gray-600">Response Code:</span>
                                <p className="font-mono">{txn.responseCode}</p>
                              </div>
                              <div>
                                <span className="font-semibold text-gray-600">Type Code:</span>
                                <p className="font-mono">{txn.tranTypeCode}</p>
                              </div>
                            </div>
                            <div className="mt-4 pt-4 border-t">
                              <Link
                                href={`/admin/eazypay/transaction-lookup?rrn=${txn.rrn}&authCode=${txn.authCode}`}
                                className="text-primary-600 hover:text-primary-700 text-sm underline"
                              >
                                Lookup Full Details →
                              </Link>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-t gap-4">
              <div className="text-sm text-gray-600">
                Showing {transactions.length} of {totalCount} transactions
              </div>
              <div className="flex gap-2 items-center">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page === 1 || loading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {page} of {Math.ceil(totalCount / size) || 1}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={transactions.length < size || loading}
                  className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

