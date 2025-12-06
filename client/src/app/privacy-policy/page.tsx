'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-sm text-gray-500 mb-8">Last updated: {new Date().toLocaleDateString()}</p>

      <div className="space-y-6 text-gray-800 leading-relaxed">
        <p>
          Welcome to <span className="text-primary-600 font-semibold">Hello One Bahrain</span>.
        </p>
        <p>
          This Privacy Policy explains how we collect, use, disclose, and protect your information when you visit
          or make a purchase from <strong>helloonebahrain.com</strong>, owned and operated by Zoom Consultancy,
          a company under the Zoom Group of Companies in the Kingdom of Bahrain.
        </p>
        <p>
          By using our website, you consent to the data practices described in this policy.
        </p>

        <h2 className="text-2xl font-semibold mt-8">1. Information We Collect</h2>

        <h3 className="text-xl font-semibold mt-4">1.1 Information You Provide Directly</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Full name</li>
          <li>Email address</li>
          <li>Phone number</li>
          <li>Shipping address</li>
          <li>Billing address</li>
          <li>Account details (login email/password — encrypted)</li>
          <li>
            Payment information (processed securely through approved payment gateways; we do{' '}
            <strong>not</strong> store card details)
          </li>
        </ul>

        <h3 className="text-xl font-semibold mt-4">1.2 Automatically Collected Information</h3>
        <p>When you use our website, we automatically collect:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>IP address</li>
          <li>Browser type and version</li>
          <li>Device information</li>
          <li>Location data (approximate, if allowed)</li>
          <li>Pages visited and time spent on pages</li>
          <li>Cookies and tracking identifiers</li>
        </ul>

        <h3 className="text-xl font-semibold mt-4">1.3 Information from Third Parties</h3>
        <p>We may receive information from:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Payment processors (transaction verification)</li>
          <li>Delivery partners (shipping updates)</li>
          <li>Analytics platforms (Google Analytics, Meta Pixel, etc.)</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">2. How We Use Your Information</h2>
        <p>We use the information we collect for the following purposes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>To process and fulfill orders</li>
          <li>To provide customer support</li>
          <li>To create and manage user accounts</li>
          <li>To process payments securely</li>
          <li>To send order confirmations, updates, and notifications</li>
          <li>To improve website performance and user experience</li>
          <li>To detect and prevent fraud or misuse</li>
          <li>To comply with Bahraini legal and regulatory requirements</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">3. Sharing &amp; Disclosure of Information</h2>
        <p>
          We <strong>do not</strong> sell or rent your personal information.
        </p>
        <p>We may share your data only with trusted third parties necessary to operate our business:</p>

        <h3 className="text-xl font-semibold mt-4">3.1 Payment Gateways</h3>
        <p>For secure payment processing via:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>BENEFIT</li>
          <li>Visa / Mastercard payment processors</li>
          <li>Other approved financial gateways</li>
        </ul>

        <h3 className="text-xl font-semibold mt-4">3.2 Shipping &amp; Delivery Providers</h3>
        <p>To deliver your products or items purchased.</p>

        <h3 className="text-xl font-semibold mt-4">3.3 Hotel Partners / Event Organizers</h3>
        <p>If you book tickets or hotel services through our platform (future category).</p>

        <h3 className="text-xl font-semibold mt-4">3.4 Legal Requirements</h3>
        <p>We may disclose personal information if required:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>By Bahraini law</li>
          <li>To comply with a court order</li>
          <li>To protect our rights, users, and company assets</li>
        </ul>

        <h3 className="text-xl font-semibold mt-4">3.5 Business Transfers</h3>
        <p>
          If <span className="text-primary-600 font-semibold">Hello One Bahrain</span> or Zoom Consultancy merges or sells assets, user data may be transferred securely
          as part of that transaction.
        </p>

        <h2 className="text-2xl font-semibold mt-8">4. Data Protection &amp; Security</h2>
        <p>We use advanced protective measures, including:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>SSL encryption</li>
          <li>Encrypted password storage</li>
          <li>Secure servers</li>
          <li>Restricted administrative access</li>
          <li>Tokenized payment processing</li>
          <li>Anti-fraud monitoring</li>
        </ul>
        <p>
          Despite these measures, no online service is 100% secure, but we strive to maintain the highest level of
          protection.
        </p>

        <h2 className="text-2xl font-semibold mt-8">5. Your Rights</h2>
        <p>You have the right to:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Request a copy of your personal data</li>
          <li>Correct or update your information</li>
          <li>Request deletion of your data (where legally allowed)</li>
          <li>Opt out of marketing communications</li>
          <li>Disable cookies in your browser settings</li>
        </ul>
        <p>To exercise your rights, you may contact us using the details provided below.</p>

        <h2 className="text-2xl font-semibold mt-8">6. Data Retention</h2>
        <p>We retain information only as long as needed for business and legal purposes:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Transaction and order history: 5 years (required by Bahrain law)</li>
          <li>Account information: until deleted by the user</li>
          <li>Marketing communication data: until you unsubscribe</li>
          <li>Log and analytics data: typically 12–36 months</li>
        </ul>

        <h2 className="text-2xl font-semibold mt-8">7. Cookies &amp; Tracking Technologies</h2>
        <p>We use cookies and similar technologies for:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Website functionality</li>
          <li>Security</li>
          <li>Analytics</li>
          <li>Personalized content</li>
          <li>Tracking performance</li>
          <li>Marketing and advertising</li>
        </ul>
        <p>
          You can disable cookies in your browser, but some website features may not work properly if cookies are
          disabled.
        </p>

        <h2 className="text-2xl font-semibold mt-8">8. Children&apos;s Privacy</h2>
        <p>Our website is intended for users aged 13 and above.</p>
        <p>We do not knowingly collect personal information from children under 13.</p>

        <h2 className="text-2xl font-semibold mt-8">9. International Users</h2>
        <p>
          Although we operate from Bahrain, users may access our website globally. By using our website, you
          consent to data transfer according to Bahraini law.
        </p>

        <h2 className="text-2xl font-semibold mt-8">10. Changes to This Privacy Policy</h2>
        <p>We may update this policy periodically.</p>
        <p>The updated version will have a &quot;Last Updated&quot; date at the top.</p>
        <p>Continued use of our website means you accept the revised policy.</p>

        <h2 className="text-2xl font-semibold mt-8">11. Contact Us</h2>
        <p>For questions about this Privacy Policy or your personal data, please contact us:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>
            Email: <a href="mailto:support@zoombahrain.co" className="text-primary-600 hover:underline">support@zoombahrain.co</a>
          </li>
          <li>
            Phone: <a href="tel:+97338814222" className="text-primary-600 hover:underline">+973 3881 4222</a>
          </li>
          <li>
            Website:{' '}
            <a
              href="https://www.helloonebahrain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:underline"
            >
              www.helloonebahrain.com
            </a>
          </li>
          <li>
            Address: Office No. 12, Building 656, Road 3625, Block 336, Adliya, Manama, Bahrain
          </li>
        </ul>
      </div>
    </div>
  );
}




