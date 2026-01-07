import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
  return (
    <div className="relative w-full h-[600px] md:h-[700px] lg:h-[800px] overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1578070181910-f1e514afdd08?w=1920"
          alt="Bahrain Skyline"
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="relative h-full flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white mb-6 leading-tight">
            Welcome to Bahrain
          </h1>
          
          {/* Sub Headline */}
          <p className="text-xl md:text-2xl lg:text-3xl text-white/95 mb-4 font-medium">
            History, Culture, Life, Business & Community
          </p>
          
          {/* Value Proposition */}
          <p className="text-lg md:text-xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed">
            Your complete guide to the Kingdom of Bahrain: places to visit, history, culture, opportunities, and daily life
          </p>

          {/* Primary CTAs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <Link
              href="#explore"
              className="px-6 py-4 bg-white text-primary-600 rounded-lg font-semibold hover:bg-gray-100 transition-all transform hover:scale-105 shadow-lg"
            >
              Explore Bahrain
            </Link>
            <Link
              href="#visit"
              className="px-6 py-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg"
            >
              Visit & Travel
            </Link>
            <Link
              href="#live-work"
              className="px-6 py-4 bg-white/10 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/20 transition-all transform hover:scale-105 backdrop-blur-sm"
            >
              Live & Work
            </Link>
            <Link
              href="#happening"
              className="px-6 py-4 bg-white/10 text-white border-2 border-white rounded-lg font-semibold hover:bg-white/20 transition-all transform hover:scale-105 backdrop-blur-sm"
            >
              What's Happening
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg
          className="w-6 h-6 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
      </div>
    </div>
  );
}

