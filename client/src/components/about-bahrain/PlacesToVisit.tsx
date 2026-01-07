import Image from 'next/image';
import Link from 'next/link';

const places = {
  cultural: [
    {
      name: "Qal'at al-Bahrain",
      description: "Ancient UNESCO World Heritage site",
      image: "https://images.unsplash.com/photo-1564507592333-c60657eea523?w=800"
    },
    {
      name: "Bahrain National Museum",
      description: "6,000 years of Bahraini history",
      image: "https://images.unsplash.com/photo-1566127444979-b3d2b5d9f1f7?w=800"
    },
    {
      name: "Al Fateh Grand Mosque",
      description: "One of the world's largest mosques",
      image: "https://images.unsplash.com/photo-1564769610628-f4a1daed8c10?w=800"
    },
  ],
  modern: [
    {
      name: "Bahrain World Trade Center",
      description: "Iconic twin tower landmark",
      image: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=800"
    },
    {
      name: "The Avenues Bahrain",
      description: "Luxury waterfront shopping",
      image: "https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800"
    },
    {
      name: "City Centre Bahrain",
      description: "Premier shopping destination",
      image: "https://images.unsplash.com/photo-1519567241046-7f570eee3ce6?w=800"
    },
  ],
  nature: [
    {
      name: "Tree of Life",
      description: "400-year-old desert mystery",
      image: "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=800"
    },
    {
      name: "Beautiful Beaches",
      description: "Crystal clear Arabian Gulf waters",
      image: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800"
    },
    {
      name: "Pearl Diving Sites",
      description: "Historic pearl diving heritage",
      image: "https://images.unsplash.com/photo-1582967788606-a171c1080cb0?w=800"
    },
  ],
};

export default function PlacesToVisit() {
  return (
    <section id="visit" className="py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Places to Visit in Bahrain
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Discover the perfect blend of ancient culture and modern luxury
          </p>
        </div>

        {/* Cultural & Historical */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-primary-600 mr-3">🏛️</span>
            Cultural & Historical
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {places.cultural.map((place, index) => (
              <div key={index} className="group border border-transparent hover:border-gray-300 rounded-lg overflow-hidden transition-all duration-300">
                <div className="relative h-64">
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{place.name}</h4>
                  <p className="text-gray-600">{place.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Modern & Lifestyle */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-primary-600 mr-3">🏙️</span>
            Modern & Lifestyle
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {places.modern.map((place, index) => (
              <div key={index} className="group border border-transparent hover:border-gray-300 rounded-lg overflow-hidden transition-all duration-300">
                <div className="relative h-64">
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{place.name}</h4>
                  <p className="text-gray-600">{place.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Nature & Unique */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 flex items-center">
            <span className="text-primary-600 mr-3">🌴</span>
            Nature & Unique Experiences
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {places.nature.map((place, index) => (
              <div key={index} className="group border border-transparent hover:border-gray-300 rounded-lg overflow-hidden transition-all duration-300">
                <div className="relative h-64">
                  <Image
                    src={place.image}
                    alt={place.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6">
                  <h4 className="text-xl font-bold text-gray-900 mb-2">{place.name}</h4>
                  <p className="text-gray-600">{place.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link
            href="/places"
            className="inline-flex items-center px-8 py-4 bg-primary-600 text-white rounded-lg font-semibold text-lg hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
          >
            View All Places to Visit
            <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

