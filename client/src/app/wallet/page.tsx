import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Wallet & Payments | Hello One Bahrain',
  description: 'Manage your digital wallet and payments on Hello One Bahrain',
};

export default function WalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Wallet & Payments
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Manage your digital wallet and payments on Hello One Bahrain
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
            <div className="flex flex-col items-center justify-center space-y-4">
              <svg
                className="w-24 h-24 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800">
                Coming Soon
              </h2>
              <p className="text-gray-600 text-center">
                The Wallet & Payments module is under development. 
                This will provide a digital wallet system with support for Tap, BenefitPay, and other payment gateways.
              </p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
              >
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

