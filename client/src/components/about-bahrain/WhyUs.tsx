import Link from 'next/link';

const features = [
  { icon: '📰', title: 'Local News', description: 'Stay informed with curated Bahrain news' },
  { icon: '💼', title: 'Jobs & Property', description: 'Find opportunities and homes' },
  { icon: '🎉', title: 'Events & Community', description: 'Connect with local happenings' },
  { icon: '✅', title: 'Trusted Content', description: 'Local-first, verified information' },
  { icon: '🌐', title: 'Comprehensive Guide', description: 'Everything Bahrain in one place' },
  { icon: '🤝', title: 'Community-Driven', description: 'Built for residents and visitors' },
];

export default function WhyUs() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Why HelloOneBahrain?
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Your digital home for life in Bahrain
          </p>
        </div>

        {/* Brand Message */}
        <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 md:p-12 text-white mb-12 shadow-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">🏠</div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">
              HelloOneBahrain is more than a guide
            </h3>
            <p className="text-xl md:text-2xl text-white/95 mb-8 leading-relaxed">
              It's the digital home for life in Bahrain
            </p>
            <p className="text-lg text-white/90 leading-relaxed">
              Whether you're visiting for the first time, moving to the Kingdom, or have lived here for years, 
              HelloOneBahrain connects you to everything that makes Bahrain special — from breaking news and 
              upcoming events to job opportunities and community connections.
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl border border-gray-200 hover:border-primary-300 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
            >
              <div className="text-5xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Value Proposition */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl font-bold text-primary-600 mb-2">10K+</div>
            <p className="text-gray-700 font-semibold">Community Members</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl font-bold text-primary-600 mb-2">1000+</div>
            <p className="text-gray-700 font-semibold">Job Listings</p>
          </div>
          <div className="text-center p-6 bg-white rounded-xl border border-gray-200">
            <div className="text-4xl font-bold text-primary-600 mb-2">500+</div>
            <p className="text-gray-700 font-semibold">Events Monthly</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-8 md:p-12 border border-blue-100">
          <div className="max-w-4xl mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Start Exploring Bahrain Today
            </h3>
            <p className="text-lg text-gray-700 mb-8">
              Join thousands of residents, expats, and visitors who trust HelloOneBahrain 
              as their go-to resource for everything about the Kingdom
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/shop"
                className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Visit Our Shop
                <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </Link>
              <Link
                href="/community"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all transform hover:scale-105"
              >
                Join Community
                <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

