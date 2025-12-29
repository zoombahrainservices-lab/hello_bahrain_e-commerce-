import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Classifieds | Hello One Bahrain',
  description: 'Buy and sell items, find services, and post listings in Bahrain',
};

export default function ClassifiedsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Classifieds
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Buy and sell items, find services, and post listings in Bahrain
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
                  d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800">
                Coming Soon
              </h2>
              <p className="text-gray-600 text-center">
                The Classifieds module is under development. 
                This will allow users to post listings, buy and sell items, and find services.
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

