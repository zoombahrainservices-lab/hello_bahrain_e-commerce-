'use client';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Shipping Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-4 text-gray-800 leading-relaxed">
        <p>
          This page explains how shipping, delivery times, and related charges are handled for orders placed on
          Hello One Bahrain.
        </p>
        <p>
          You can customize this content with your exact delivery areas, expected timelines, and shipping fees.
          For now, if you have any questions about shipping, please reach out to our support team.
        </p>
      </div>
    </div>
  );
}


