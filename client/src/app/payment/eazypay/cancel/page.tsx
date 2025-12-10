'use client';

export default function EazyPayCancelPage() {
  return (
    <main className="max-w-xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Payment Cancelled</h1>
      <p className="mb-6">
        Your EazyPay payment was cancelled. You can try again or choose a different payment
        method at checkout.
      </p>
      <a
        href="/checkout/payment"
        className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
      >
        Back to payment
      </a>
    </main>
  );
}












