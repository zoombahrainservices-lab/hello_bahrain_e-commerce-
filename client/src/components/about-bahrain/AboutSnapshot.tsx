import Link from 'next/link';

const bahrainFacts = [
  { icon: '🌍', label: 'Location', value: 'Arabian Gulf' },
  { icon: '🏛️', label: 'Capital', value: 'Manama' },
  { icon: '👥', label: 'Population', value: '~1.7 Million' },
  { icon: '🗣️', label: 'Languages', value: 'Arabic (English widely spoken)' },
  { icon: '💱', label: 'Currency', value: 'Bahraini Dinar (BHD)' },
  { icon: '🕐', label: 'Time Zone', value: 'AST (UTC+3)' },
  { icon: '🕌', label: 'Religion', value: 'Islam (Religious tolerance)' },
  { icon: '👑', label: 'Government', value: 'Constitutional Monarchy' },
];

export default function AboutSnapshot() {
  return (
    <section id="about" className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            About Bahrain
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the Kingdom of Bahrain at a glance
          </p>
        </div>

        {/* Facts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {bahrainFacts.map((fact, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 transform hover:scale-105 border border-gray-100"
            >
              <div className="text-4xl mb-3">{fact.icon}</div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-1">
                {fact.label}
              </h3>
              <p className="text-lg font-bold text-gray-900">{fact.value}</p>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="bg-primary-50 rounded-xl p-8 md:p-12 border border-primary-100">
          <div className="max-w-4xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4 text-center">
              A Modern Island Nation with Ancient Roots
            </h3>
            <p className="text-lg text-gray-700 leading-relaxed mb-6 text-center">
              Bahrain, officially the Kingdom of Bahrain, is an island country in Western Asia. 
              It comprises a small archipelago made up of 50 natural islands and an additional 
              33 artificial islands. One of the most ancient civilizations in the region, Bahrain 
              has been continuously inhabited for over 5,000 years.
            </p>
            <div className="flex justify-center">
              <Link
                href="#history"
                className="inline-flex items-center px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
              >
                Learn More About Bahrain
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

