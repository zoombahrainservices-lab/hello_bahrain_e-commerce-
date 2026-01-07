import Link from 'next/link';

// Placeholder data - will connect to backend later
const newsItems = [
  { title: 'Bahrain Announces New Tourism Initiatives', date: 'Jan 5, 2026', category: 'Tourism' },
  { title: 'Tech Startup Hub Opens in Manama', date: 'Jan 3, 2026', category: 'Business' },
  { title: 'Cultural Festival 2026 Dates Announced', date: 'Dec 30, 2025', category: 'Culture' },
];

const upcomingEvents = [
  { title: 'Bahrain Grand Prix 2026', date: 'March 2026', location: 'Bahrain International Circuit' },
  { title: 'Spring of Culture Festival', date: 'March-April 2026', location: 'Various Venues' },
  { title: 'Bahrain Food Festival', date: 'February 2026', location: 'Bahrain Bay' },
];

export default function WhatsHappening() {
  return (
    <section id="happening" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            What's Happening in Bahrain Today
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Stay updated with the latest news, events, and happenings
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Latest News */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <span className="text-primary-600 mr-3">📰</span>
                Latest News
              </h3>
              <Link href="/news" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {newsItems.map((item, index) => (
                <div
                  key={index}
                  className="bg-gray-50 p-6 rounded-lg border border-transparent hover:border-primary-300 hover:bg-white transition-all duration-300 hover:shadow-md cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="px-3 py-1 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                      {item.category}
                    </span>
                    <span className="text-sm text-gray-500">{item.date}</span>
                  </div>
                  <h4 className="text-lg font-bold text-gray-900 hover:text-primary-600 transition-colors">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Upcoming Events */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center">
                <span className="text-primary-600 mr-3">📅</span>
                Upcoming Events
              </h3>
              <Link href="/events" className="text-primary-600 hover:text-primary-700 font-semibold text-sm">
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {upcomingEvents.map((event, index) => (
                <div
                  key={index}
                  className="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-lg border border-transparent hover:border-blue-300 transition-all duration-300 hover:shadow-md cursor-pointer"
                >
                  <h4 className="text-lg font-bold text-gray-900 mb-2 hover:text-primary-600 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center text-sm text-gray-600 mb-1">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    {event.date}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.location}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Community Engagement CTA */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 md:p-12 text-white text-center shadow-xl">
          <div className="max-w-3xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold mb-4">
              Join the Conversation
            </h3>
            <p className="text-lg text-white/95 mb-6">
              Connect with the community, share your experiences, and stay informed about everything happening in Bahrain
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/news"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-green-600 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105"
              >
                Read Latest News
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href="/events"
                className="inline-flex items-center justify-center px-8 py-4 bg-white/10 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/20 transition-all transform hover:scale-105 backdrop-blur-sm"
              >
                Browse Events
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

