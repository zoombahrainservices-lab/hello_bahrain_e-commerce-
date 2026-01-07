import Link from 'next/link';

const industries = [
  { name: 'Finance & Banking', icon: '🏦', description: 'Regional financial hub' },
  { name: 'Fintech', icon: '💳', description: 'Growing tech ecosystem' },
  { name: 'Tourism & Hospitality', icon: '✈️', description: 'Thriving sector' },
  { name: 'Logistics & Trade', icon: '🚢', description: 'Strategic location' },
  { name: 'Technology', icon: '💻', description: 'Innovation-driven' },
  { name: 'Real Estate', icon: '🏗️', description: 'Booming market' },
];

const benefits = [
  '100% foreign ownership in many sectors',
  'Strategic location between East and West',
  'Modern infrastructure and connectivity',
  'Skilled, multilingual workforce',
  'Business-friendly regulations',
  'Free zones with special incentives',
];

export default function BusinessWork() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Working & Doing Business in Bahrain
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            A thriving economy with opportunities for professionals and entrepreneurs
          </p>
        </div>

        {/* Economy Overview */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-white mb-12 shadow-xl">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4 text-center">Economy Overview</h3>
            <p className="text-lg text-white/95 leading-relaxed text-center mb-6">
              Bahrain has a well-diversified economy with strong sectors in financial services, tourism, 
              and manufacturing. As one of the GCC's most open economies, it offers excellent opportunities 
              for international businesses and professionals.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-3xl font-bold">$38B+</div>
                <div className="text-sm text-white/80">GDP</div>
              </div>
              <div>
                <div className="text-3xl font-bold">200K+</div>
                <div className="text-sm text-white/80">Businesses</div>
              </div>
              <div>
                <div className="text-3xl font-bold">70%</div>
                <div className="text-sm text-white/80">Service Sector</div>
              </div>
              <div>
                <div className="text-3xl font-bold">#1</div>
                <div className="text-sm text-white/80">Financial Hub</div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Industries */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Key Industries
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {industries.map((industry, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-transparent hover:border-primary-300 transition-all duration-300 hover:shadow-lg"
              >
                <div className="text-4xl mb-3">{industry.icon}</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{industry.name}</h4>
                <p className="text-gray-600">{industry.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Business Benefits & Startup Ecosystem */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Business Benefits */}
          <div className="bg-green-50 p-8 rounded-xl border border-green-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Why Do Business in Bahrain?</h3>
            <ul className="space-y-3">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-start">
                  <svg className="w-6 h-6 text-green-500 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Startup Ecosystem */}
          <div className="bg-blue-50 p-8 rounded-xl border border-blue-100">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Startup Ecosystem</h3>
            <div className="space-y-4">
              <div>
                <h4 className="font-bold text-gray-900 mb-2">🚀 Incubators & Accelerators</h4>
                <p className="text-gray-700">Bahrain FinTech Bay, C5 Accelerate, and more</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">💰 Funding Opportunities</h4>
                <p className="text-gray-700">Active VC scene and government support programs</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">🌐 Networking</h4>
                <p className="text-gray-700">Vibrant community events and meetups</p>
              </div>
              <div>
                <h4 className="font-bold text-gray-900 mb-2">📜 Regulatory Support</h4>
                <p className="text-gray-700">Progressive regulations and easy company setup</p>
              </div>
            </div>
          </div>
        </div>

        {/* Employment Culture */}
        <div className="bg-purple-50 rounded-xl p-8 mb-12 border border-purple-100">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Employment Culture</h3>
          <p className="text-gray-700 text-center max-w-3xl mx-auto mb-6">
            Bahrain offers a professional, international work environment with a healthy work-life balance. 
            The workforce is diverse, skilled, and English-speaking, making it easy for expatriates to integrate 
            into the business community.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl mb-2">⏰</div>
              <h4 className="font-bold text-gray-900">Working Hours</h4>
              <p className="text-gray-600 text-sm">Typically 8-9 hours/day</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">🌴</div>
              <h4 className="font-bold text-gray-900">Annual Leave</h4>
              <p className="text-gray-600 text-sm">30 days minimum</p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">📅</div>
              <h4 className="font-bold text-gray-900">Weekend</h4>
              <p className="text-gray-600 text-sm">Saturday & Sunday</p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/jobs"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Browse Jobs in Bahrain
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </Link>
          <Link
            href="/business"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all transform hover:scale-105"
          >
            Start a Business
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

