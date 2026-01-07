import Link from 'next/link';

const activities = [
  {
    icon: '🎭',
    title: 'Cultural Experiences',
    description: 'Museums, traditional souks, heritage sites',
    color: 'bg-purple-100 text-purple-600'
  },
  {
    icon: '🍽️',
    title: 'Food & Dining',
    description: 'Traditional Bahraini cuisine to international flavors',
    color: 'bg-orange-100 text-orange-600'
  },
  {
    icon: '🌃',
    title: 'Nightlife & Entertainment',
    description: 'Vibrant bars, clubs, and entertainment venues',
    color: 'bg-blue-100 text-blue-600'
  },
  {
    icon: '🏜️',
    title: 'Desert Safaris',
    description: 'Thrilling 4x4 adventures and desert camps',
    color: 'bg-yellow-100 text-yellow-600'
  },
  {
    icon: '🏄',
    title: 'Water Sports',
    description: 'Diving, sailing, jet skiing, and more',
    color: 'bg-cyan-100 text-cyan-600'
  },
  {
    icon: '🛍️',
    title: 'Shopping',
    description: 'From traditional markets to luxury malls',
    color: 'bg-pink-100 text-pink-600'
  },
];

export default function ThingsToDo() {
  return (
    <section id="things-to-do" className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Things to Do in Bahrain
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            From cultural exploration to adrenaline-pumping adventures
          </p>
        </div>

        {/* Activities Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {activities.map((activity, index) => (
            <div
              key={index}
              className="bg-white p-8 rounded-xl border border-transparent hover:border-gray-300 transition-all duration-300 hover:shadow-xl transform hover:scale-105"
            >
              <div className={`w-16 h-16 ${activity.color} rounded-lg flex items-center justify-center text-4xl mb-4`}>
                {activity.icon}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{activity.title}</h3>
              <p className="text-gray-600">{activity.description}</p>
            </div>
          ))}
        </div>

        {/* Special Highlight - Formula 1 */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 rounded-2xl p-8 md:p-12 text-white shadow-2xl">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-4">🏎️</div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              Formula 1 & Motorsports
            </h3>
            <p className="text-lg md:text-xl mb-6 text-white/90">
              Home to the Bahrain International Circuit, hosting the prestigious Formula 1 Grand Prix 
              and world-class motorsport events throughout the year
            </p>
            <Link
              href="/formula1"
              className="inline-flex items-center px-8 py-4 bg-white text-red-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-all transform hover:scale-105"
            >
              Explore Motorsports in Bahrain
              <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            href="/activities"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
          >
            Explore All Activities
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

