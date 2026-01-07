const cuisineItems = [
  { name: 'Machboos', description: 'Traditional spiced rice with meat', emoji: '🍚' },
  { name: 'Fresh Seafood', description: 'Gulf shrimp, hammour, and more', emoji: '🦐' },
  { name: 'Halwa', description: 'Sweet traditional dessert', emoji: '🍮' },
  { name: 'Arabic Coffee', description: 'Aromatic traditional coffee', emoji: '☕' },
];

const culturalAspects = [
  { title: 'Festivals & Events', description: 'Bahrain hosts numerous cultural festivals, including the Spring of Culture, National Day celebrations, and various religious observances throughout the year.', icon: '🎉' },
  { title: 'Traditional Music & Dance', description: 'Fijiri sea music, traditional pearl diving songs, and contemporary Arabic music create a rich musical heritage.', icon: '🎵' },
  { title: 'Traditional Dress', description: 'Men wear the traditional thobe, while women may wear the abaya. Modern fashion coexists with traditional attire.', icon: '👗' },
  { title: 'Hospitality Culture', description: 'Bahrainis are known for their warm hospitality, welcoming nature, and generosity toward guests.', icon: '🤝' },
];

export default function CultureFood() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
            Culture, Food & Traditions
          </h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            Experience the rich heritage and flavors of Bahrain
          </p>
        </div>

        {/* Bahraini Cuisine */}
        <div className="mb-16">
          <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8 text-center">
            Bahraini Cuisine
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {cuisineItems.map((item, index) => (
              <div
                key={index}
                className="bg-white p-6 rounded-xl border border-transparent hover:border-orange-300 transition-all duration-300 hover:shadow-lg text-center"
              >
                <div className="text-5xl mb-3">{item.emoji}</div>
                <h4 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h4>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-700 max-w-3xl mx-auto">
            Bahraini cuisine reflects the island's history as a trading hub, blending Arabian, Persian, 
            Indian, and international influences. Fresh seafood is a staple, and traditional dishes are 
            generously spiced with local flavors.
          </p>
        </div>

        {/* Cultural Aspects */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {culturalAspects.map((aspect, index) => (
            <div
              key={index}
              className="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-xl border border-purple-100"
            >
              <div className="text-4xl mb-4">{aspect.icon}</div>
              <h4 className="text-2xl font-bold text-gray-900 mb-3">{aspect.title}</h4>
              <p className="text-gray-700 leading-relaxed">{aspect.description}</p>
            </div>
          ))}
        </div>

        {/* Heritage Highlight */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-2xl p-8 md:p-12 text-white shadow-xl">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-4">🏺</div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4">
              A Living Heritage
            </h3>
            <p className="text-lg md:text-xl text-white/95 mb-6">
              Bahrain proudly preserves its cultural identity while embracing modernity. From ancient burial 
              mounds to contemporary art galleries, the Kingdom offers a unique blend of tradition and progress. 
              Visitors and residents alike can experience authentic Bahraini culture through local markets, 
              traditional crafts, and community celebrations.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">Pearl Diving Heritage</span>
              <span className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">Traditional Crafts</span>
              <span className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">Ancient Dilmun</span>
              <span className="px-4 py-2 bg-white/20 rounded-lg backdrop-blur-sm">Islamic Architecture</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

