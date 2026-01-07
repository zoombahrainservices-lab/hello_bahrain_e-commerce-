import HeroSection from '@/components/about-bahrain/HeroSection';
import AboutSnapshot from '@/components/about-bahrain/AboutSnapshot';
import PlacesToVisit from '@/components/about-bahrain/PlacesToVisit';
import ThingsToDo from '@/components/about-bahrain/ThingsToDo';
import LivingGuide from '@/components/about-bahrain/LivingGuide';
import BusinessWork from '@/components/about-bahrain/BusinessWork';
import CultureFood from '@/components/about-bahrain/CultureFood';
import WhatsHappening from '@/components/about-bahrain/WhatsHappening';
import TravelInfo from '@/components/about-bahrain/TravelInfo';
import WhyUs from '@/components/about-bahrain/WhyUs';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bahrain - Complete Guide to History, Culture, Living & Tourism | HelloOneBahrain',
  description: 'Discover everything about Bahrain - the ultimate guide to visiting, living, and working in the Kingdom. Explore tourist attractions, culture, business opportunities, expat life, and more.',
  keywords: 'Bahrain, Visit Bahrain, Bahrain tourism, Living in Bahrain, Working in Bahrain, Bahrain history, Things to do in Bahrain, Expat life Bahrain, Bahrain travel guide',
  openGraph: {
    title: 'Bahrain - Your Complete Guide to the Kingdom',
    description: 'Everything you need to know about Bahrain: tourism, culture, living, working, and more',
    type: 'website',
    locale: 'en_US',
    url: 'https://helloonebahrain.com',
    siteName: 'HelloOneBahrain',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bahrain - Complete Guide | HelloOneBahrain',
    description: 'Discover everything about Bahrain - tourism, culture, living, and working in the Kingdom',
  },
  alternates: {
    canonical: 'https://helloonebahrain.com',
  },
};

export default function HomePage() {
  return (
    <main className="min-h-screen">
      {/* Structured Data for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'TouristDestination',
            name: 'Kingdom of Bahrain',
            description: 'An island nation in the Arabian Gulf known for its rich history, modern culture, and vibrant lifestyle',
            url: 'https://helloonebahrain.com',
            image: 'https://helloonebahrain.com/og-image.jpg',
            address: {
              '@type': 'PostalAddress',
              addressCountry: 'BH',
              addressLocality: 'Manama',
            },
            geo: {
              '@type': 'GeoCoordinates',
              latitude: 26.0667,
              longitude: 50.5577,
            },
            touristType: ['Business', 'Leisure', 'Cultural', 'Adventure'],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'HelloOneBahrain',
            url: 'https://helloonebahrain.com',
            logo: 'https://helloonebahrain.com/logo.png',
            description: 'Your digital home for life in Bahrain - news, events, jobs, community, and comprehensive guides',
            sameAs: [
              'https://facebook.com/helloonebahrain',
              'https://twitter.com/helloonebahrain',
              'https://instagram.com/helloonebahrain',
            ],
          }),
        }}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* About Bahrain Snapshot */}
      <AboutSnapshot />

      {/* Places to Visit */}
      <PlacesToVisit />

      {/* Things to Do */}
      <ThingsToDo />

      {/* Living in Bahrain */}
      <LivingGuide />

      {/* Business & Work */}
      <BusinessWork />

      {/* Culture & Food */}
      <CultureFood />

      {/* What's Happening Today */}
      <WhatsHappening />

      {/* Travel Information */}
      <TravelInfo />

      {/* Why HelloOneBahrain */}
      <WhyUs />
    </main>
  );
}
