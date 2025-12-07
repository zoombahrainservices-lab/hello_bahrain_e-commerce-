'use client';

export default function ShippingPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Shipping &amp; Delivery Policy — Hello One Bahrain</h1>
      <p className="text-sm text-gray-500 mb-8">Last Updated: December 4, 2025</p>

      <div className="space-y-6 text-gray-800 leading-relaxed">
        <p>
          <span className="text-primary-600 font-semibold">Hello One Bahrain</span> is committed to providing fast, reliable delivery within Bahrain.
        </p>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">1. Delivery Areas</h2>
          <p className="mb-2">We deliver across:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Manama</li>
            <li>Muharraq</li>
            <li>Riffa</li>
            <li>Isa Town</li>
            <li>Saar</li>
            <li>Hamad Town</li>
            <li>And other Bahrain regions</li>
          </ul>
          <p className="mt-2">(Some areas may vary based on courier coverage.)</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">2. Delivery Timeframes</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li><strong>Standard delivery: 2–3 working days</strong></li>
            <li>Remote areas may require additional time.</li>
            <li>Orders during weekends or holidays may process next business day.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">3. Delivery Fees</h2>
          <p className="mb-2">Delivery charges are shown at checkout and vary based on:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Region</li>
            <li>Promotion/free shipping offers</li>
            <li>Order value</li>
          </ul>
          <p className="mt-2">Return shipping fees may apply based on our Return Policy.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">4. Delivery Attempts</h2>
          <p className="mb-2">If delivery fails due to:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Wrong address</li>
            <li>Customer not available</li>
          </ul>
          <p className="mt-2">A re-delivery attempt may be arranged. Extra charges may apply.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">5. Order Tracking</h2>
          <p>Tracking details or courier contact may be provided after dispatch.</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">6. Click &amp; Collect (If enabled)</h2>
          <p>(Some businesses offer pick-up; if not applicable, remove this point)</p>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">7. International Shipping</h2>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>We may offer international shipping where applicable.</li>
            <li>Customs fees, VAT, and duties are the buyer&apos;s responsibility.</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">8. Damaged or Missing Orders</h2>
          <p className="mb-2">If your order arrives damaged or missing, contact us within <strong>48 hours</strong> with:</p>
          <ul className="list-disc list-inside space-y-2 ml-4">
            <li>Order number</li>
            <li>Photos/video of issue</li>
          </ul>
        </section>

        <section className="mt-8">
          <h2 className="text-2xl font-semibold mb-4">9. Contact for Delivery Assistance</h2>
          <ul className="list-none space-y-2 ml-4">
            <li>📧 Email: <a href="mailto:support@zoombahrain.co" className="text-primary-600 hover:underline">support@zoombahrain.co</a></li>
            <li>📞 Phone: <a href="tel:+97338814222" className="text-primary-600 hover:underline">+973 3881 4222</a></li>
          </ul>
        </section>
      </div>
    </div>
  );
}
