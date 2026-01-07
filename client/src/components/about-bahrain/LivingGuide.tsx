import Link from 'next/link';

const livingAspects = [
  { icon: '💰', title: 'Cost of Living', description: 'Competitive costs compared to other Gulf countries' },
  { icon: '🏠', title: 'Housing & Neighborhoods', description: 'Diverse options from apartments to villas' },
  { icon: '🎓', title: 'Schools & Universities', description: 'International schools and higher education' },
  { icon: '🏥', title: 'Healthcare', description: 'Modern medical facilities and services' },
  { icon: '🚗', title: 'Transportation', description: 'Well-connected roads and affordable taxis' },
  { icon: '🛡️', title: 'Safety & Lifestyle', description: 'Safe, family-friendly environment' },
  { icon: '🤝', title: 'Cultural Etiquette', description: 'Respectful, welcoming society' },
  { icon: '🌐', title: 'Expat Community', description: 'Large, diverse international population' },
];

export default function LivingGuide() {
  return (
    <section id="live-work" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Living in Bahrain
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto mb-6">
            Everything you need to know about expat life in the Kingdom
          </p>
          <div className="inline-block bg-primary-50 border border-primary-200 rounded-lg px-6 py-3">
            <p className="text-primary-900 font-semibold">
              🌟 Bahrain is one of the most expat-friendly countries in the Middle East
            </p>
          </div>
        </div>

        {/* Living Aspects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {livingAspects.map((aspect, index) => (
            <div
              key={index}
              className="bg-gray-50 p-6 rounded-lg border border-transparent hover:border-primary-300 hover:bg-white transition-all duration-300 hover:shadow-lg"
            >
              <div className="text-4xl mb-3">{aspect.icon}</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{aspect.title}</h3>
              <p className="text-gray-600 text-sm">{aspect.description}</p>
            </div>
          ))}
        </div>

        {/* Detailed Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Why Move to Bahrain?</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Tax-free income</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Strategic location in the Gulf</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">High quality of life</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Liberal lifestyle</span>
              </li>
              <li className="flex items-start">
                <svg className="w-6 h-6 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700">Excellent infrastructure</span>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-green-100 p-8 rounded-xl">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Getting Started</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-2">1.</span>
                <span className="text-gray-700">Obtain work visa and residence permit</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-2">2.</span>
                <span className="text-gray-700">Find housing in preferred neighborhood</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-2">3.</span>
                <span className="text-gray-700">Register with healthcare provider</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-2">4.</span>
                <span className="text-gray-700">Enroll children in school</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-2">5.</span>
                <span className="text-gray-700">Get driving license and vehicle</span>
              </li>
              <li className="flex items-start">
                <span className="text-primary-600 font-bold mr-2">6.</span>
                <span className="text-gray-700">Connect with expat community</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/living-guide"
            className="inline-flex items-center justify-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Complete Living Guide
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/moving"
            className="inline-flex items-center justify-center px-8 py-4 bg-white text-primary-600 border-2 border-primary-600 rounded-lg font-semibold text-lg hover:bg-primary-50 transition-all transform hover:scale-105"
          >
            Move to Bahrain
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

