'use client';

export default function RefundReturnPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Return &amp; Refund Policy — Hello One Bahrain</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: December 4, 2025</p>

      <div className="space-y-6 text-gray-800 leading-relaxed">
        <p>
          Thank you for shopping with <span className="text-primary-600 font-semibold">Hello One Bahrain</span>.
        </p>
        <p>
          We want you to enjoy a smooth shopping experience, and this policy explains your rights regarding returns, exchanges, and refunds.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">1. Eligibility for Returns</h2>
          <p className="mb-2">
            Items may be returned within <strong>7 days</strong> of delivery if:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>The item is unused and in original condition</li>
            <li>Tags, packaging, and accessories are intact</li>
            <li>Proof of purchase is provided</li>
          </ul>
          <p className="mt-2">Items must be returned in resaleable condition.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">2. Non-Returnable Items</h2>
          <p className="mb-2">The following cannot be returned:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Used or worn items</li>
            <li>Earrings, undergarments, hygiene products</li>
            <li>Customized / personalized products</li>
            <li>Clearance or final sale items</li>
            <li>Digital or downloadable services</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">3. Damaged, Defective, or Incorrect Items</h2>
          <p className="mb-2">If you received:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>✔ a damaged</li>
            <li>✔ faulty</li>
            <li>✔ or incorrect item</li>
          </ul>
          <p className="mt-4 mb-2">
            You must contact us within <strong>48 hours</strong> of delivery, providing:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Order number</li>
            <li>Photos/videos of the issue</li>
          </ul>
          <p className="mt-2">A replacement or refund will be issued after inspection.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">4. Refund Method &amp; Timeframe</h2>
          <p className="mb-2">
            Refunds are issued via the original payment method within:
          </p>
          <p className="ml-4 mb-2">
            <strong>5–7 working days</strong> after returned items are inspected and approved
          </p>
          <p className="mt-2">
            Shipping fees and delivery charges are non-refundable, except for faulty or wrong products.
          </p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">5. Exchanges</h2>
          <p className="mb-2">Exchanges may be allowed based on:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Size issues</li>
            <li>Stock availability</li>
          </ul>
          <p className="mt-2">If an exchange is not possible, a refund or store credit will be provided.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">6. Order Cancellation</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Orders can only be cancelled before dispatch</li>
            <li>Once shipped, you must follow the return process</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">7. Return Shipping Fee</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Return delivery fee may apply depending on reason</li>
            <li>Defective / incorrect products return is free</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">8. Contact for Returns</h2>
          <p className="mb-2">For return assistance, please contact:</p>
          <ul className="list-none space-y-2 ml-4">
            <li>📧 Email: <a href="mailto:support@zoombahrain.co" className="text-primary-600 hover:underline">support@zoombahrain.co</a></li>
            <li>📞 Phone: <a href="tel:+97338814222" className="text-primary-600 hover:underline">+973 3881 4222</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
