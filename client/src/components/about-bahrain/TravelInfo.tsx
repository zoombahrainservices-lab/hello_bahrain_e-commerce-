import Link from 'next/link';

const travelEssentials = [
  {
    title: 'Visa Information',
    icon: '🛂',
    points: [
      'Visa on arrival for many nationalities',
      'eVisa available online',
      'GCC residents special entry',
      'Tourist visas typically 2 weeks'
    ]
  },
  {
    title: 'Best Time to Visit',
    icon: '🌤️',
    points: [
      'November to March (mild weather)',
      'Average temp: 20-25°C',
      'Avoid summer (June-Aug)',
      'Formula 1 season in March'
    ]
  },
  {
    title: 'Getting Around',
    icon: '🚗',
    points: [
      'Taxis and ride-hailing apps',
      'Car rentals widely available',
      'Well-maintained roads',
      'Affordable transportation'
    ]
  },
  {
    title: 'Local Laws & Customs',
    icon: '⚖️',
    points: [
      'Dress modestly in public',
      'Respect Islamic traditions',
      'No alcohol in public spaces',
      'Photography restrictions apply'
    ]
  },
];

export default function TravelInfo() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Practical Travel Information
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to know before your visit
          </p>
        </div>

        {/* Travel Essentials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {travelEssentials.map((item, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-xl border border-gray-200 hover:border-primary-300 hover:shadow-lg transition-all duration-300"
            >
              <div className="text-5xl mb-4 text-center">{item.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 text-center">{item.title}</h3>
              <ul className="space-y-2">
                {item.points.map((point, idx) => (
                  <li key={idx} className="flex items-start text-sm text-gray-700">
                    <svg className="w-5 h-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Weather Overview */}
        <div className="bg-gradient-to-r from-sky-100 to-blue-100 rounded-xl p-8 mb-12 border border-sky-200">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Weather Overview</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-4xl mb-2">🌸</div>
              <h4 className="font-bold text-gray-900">Spring</h4>
              <p className="text-sm text-gray-600">Mar-May</p>
              <p className="text-sm font-semibold text-gray-700">20-30°C</p>
            </div>
            <div>
              <div className="text-4xl mb-2">☀️</div>
              <h4 className="font-bold text-gray-900">Summer</h4>
              <p className="text-sm text-gray-600">Jun-Aug</p>
              <p className="text-sm font-semibold text-gray-700">35-45°C</p>
            </div>
            <div>
              <div className="text-4xl mb-2">🍂</div>
              <h4 className="font-bold text-gray-900">Autumn</h4>
              <p className="text-sm text-gray-600">Sep-Nov</p>
              <p className="text-sm font-semibold text-gray-700">25-35°C</p>
            </div>
            <div>
              <div className="text-4xl mb-2">❄️</div>
              <h4 className="font-bold text-gray-900">Winter</h4>
              <p className="text-sm text-gray-600">Dec-Feb</p>
              <p className="text-sm font-semibold text-gray-700">15-25°C</p>
            </div>
          </div>
        </div>

        {/* Useful Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-8 mb-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">💡 Useful Tips</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Currency</h4>
              <p className="text-gray-700 text-sm">Bahraini Dinar (BHD) is the official currency. 1 BHD ≈ 2.65 USD. Credit cards widely accepted.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Language</h4>
              <p className="text-gray-700 text-sm">Arabic is official, but English is widely spoken. Most signs are bilingual.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Mobile & Internet</h4>
              <p className="text-gray-700 text-sm">Excellent 4G/5G coverage. Tourist SIM cards available at airport and shops.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Electricity</h4>
              <p className="text-gray-700 text-sm">230V, 50Hz. UK-style 3-pin plugs (Type G). Bring adapters if needed.</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Emergency Numbers</h4>
              <p className="text-gray-700 text-sm">Police: 999 | Ambulance: 999 | Fire: 999</p>
            </div>
            <div>
              <h4 className="font-bold text-gray-900 mb-2">Tipping</h4>
              <p className="text-gray-700 text-sm">10-15% in restaurants. Not mandatory but appreciated.</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/travel-guide"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Complete Travel Guide
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

