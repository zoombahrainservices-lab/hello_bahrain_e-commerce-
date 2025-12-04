'use client';

export default function RefundReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Refund &amp; Return Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-4 text-gray-800 leading-relaxed">
        <p>
          This page describes how refunds and returns are handled for purchases made on Hello One Bahrain.
        </p>
        <p>
          Detailed refund and return terms can be configured by your business team. For now, if you have any
          issues with an order, please contact our support team with your order number and details.
        </p>
      </div>
    </div>
  );
}


