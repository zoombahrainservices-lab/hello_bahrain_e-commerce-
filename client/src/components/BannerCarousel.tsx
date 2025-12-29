'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Banner } from '@/lib/types';

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Reset to first banner when banners change
  useEffect(() => {
    console.log('🔄 BannerCarousel: Banners updated', banners);
    setCurrentIndex(0);
  }, [banners]);

  // Log banner properties for debugging
  useEffect(() => {
    if (banners.length > 0 && banners[currentIndex]) {
      const currentBanner = banners[currentIndex];
      console.log('📊 Current banner properties:', {
        title: currentBanner.title,
        textAlign: currentBanner.textAlign,
        titleColor: currentBanner.titleColor,
        buttonAlign: currentBanner.buttonAlign,
        buttonBgColor: currentBanner.buttonBgColor,
      });
    }
  }, [banners, currentIndex]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (banners.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  if (!banners || banners.length === 0) {
    return null;
  }

  const parallaxOffset = scrollY * 0.5;

  const getHorizontalClasses = (banner: Banner) => {
    const align = banner.textAlign || 'center';
    switch (align) {
      case 'left':
        return 'items-start text-left justify-start';
      case 'right':
        return 'items-end text-right justify-end';
      default:
        return 'items-center text-center justify-center';
    }
  };

  const getVerticalClasses = (banner: Banner) => {
    const v = banner.textVertical || 'middle';
    switch (v) {
      case 'top':
        return 'items-start';
      case 'bottom':
        return 'items-end';
      default:
        return 'items-center';
    }
  };

  const getTitleSizeClass = (banner: Banner) => {
    const size = banner.titleSize || 'lg';
    if (size === 'sm') return 'text-3xl md:text-4xl lg:text-5xl';
    if (size === 'md') return 'text-4xl md:text-5xl lg:text-6xl';
    return 'text-5xl md:text-6xl lg:text-7xl';
  };

  const getSubtitleSizeClass = (banner: Banner) => {
    const size = banner.subtitleSize || 'md';
    if (size === 'sm') return 'text-base md:text-lg';
    if (size === 'lg') return 'text-xl md:text-2xl';
    return 'text-lg md:text-xl';
  };

  return (
    <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden">
      {banners.map((banner, index) => (
        <div
          key={banner._id || banner.id || index}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div
            className="relative w-full h-full"
            style={{ transform: `translateY(${parallaxOffset}px)` }}
          >
            <Image
              src={banner.image}
              alt={banner.title}
              fill
              className="object-cover"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40" />
          </div>

          <div
            className={`absolute inset-0 flex px-4 animate-fade-up ${getHorizontalClasses(
              banner
            )} ${getVerticalClasses(banner)}`}
            style={{ animationDelay: `${index === currentIndex ? '0.2s' : '0s'}` }}
          >
            <div className="max-w-4xl">
              <h1
                className={`${getTitleSizeClass(
                  banner
                )} mb-4 drop-shadow-lg`}
                style={{
                  color: banner.titleColor || '#ffffff',
                  fontWeight: banner.titleBold === false ? 'normal' : '700',
                  fontStyle: banner.titleItalic ? 'italic' : 'normal',
                }}
              >
                {banner.title}
              </h1>
              {banner.subtitle && (
                <p
                  className={`${getSubtitleSizeClass(
                    banner
                  )} mb-6 drop-shadow-md`}
                  style={{
                    color: banner.subtitleColor || '#e5e7eb',
                    fontWeight: banner.subtitleBold ? '600' : '400',
                    fontStyle: banner.subtitleItalic ? 'italic' : 'normal',
                  }}
                >
                  {banner.subtitle}
                </p>
              )}
              {banner.ctaLabel && (
                <div 
                  className="w-full flex"
                  style={{
                    justifyContent: banner.buttonAlign === 'center' ? 'center' : 
                                  banner.buttonAlign === 'right' ? 'flex-end' : 'flex-start',
                  }}
                >
                  <a
                    href={banner.ctaLink || '#'}
                    className="inline-block px-8 py-3 rounded-lg font-semibold hover:opacity-90 transition shadow-lg"
                    style={{
                      backgroundColor: banner.buttonBgColor || '#2563eb',
                      color: banner.buttonTextColor || '#ffffff',
                    }}
                  >
                    {banner.ctaLabel}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}

      {banners.length > 1 && (
        <>
          <button
            onClick={() =>
              setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length)
            }
            className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition z-10"
            aria-label="Previous banner"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>

          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-800 p-3 rounded-full shadow-lg transition z-10"
            aria-label="Next banner"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition ${
                  index === currentIndex ? 'bg-white' : 'bg-white/50'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
