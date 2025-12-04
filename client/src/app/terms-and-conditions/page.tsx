'use client';

export default function TermsAndConditionsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Terms &amp; Conditions</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-4 text-gray-800 leading-relaxed">
        <p>
          These Terms &amp; Conditions govern your use of the Hello One Bahrain website and services. By accessing
          or using our website, you agree to be bound by these terms.
        </p>
        <p>
          This page is a simplified summary and may be updated in the future with more detailed legal content.
          For any questions about your rights or obligations, please contact our support team.
        </p>
      </div>
    </div>
  );
}


