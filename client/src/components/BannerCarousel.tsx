'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Banner } from '@/lib/types';

interface BannerCarouselProps {
  banners: Banner[];
}

export default function BannerCarousel({ banners }: BannerCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    }, 5000); // Change banner every 5 seconds

    return () => clearInterval(interval);
  }, [banners.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  if (!banners || banners.length === 0) return null;

  const currentBanner = banners[currentIndex];
  
  if (!currentBanner) return null;

  // Debug: Log alignment values
  console.log('🎨 Banner alignment values:', {
    textAlign: currentBanner.textAlign,
    textVertical: currentBanner.textVertical,
    buttonAlign: currentBanner.buttonAlign,
    buttonVertical: currentBanner.buttonVertical,
  });

  // Get container flex alignment based on text position
  const getContainerAlignment = () => {
    const vertical = currentBanner.textVertical || 'middle';
    const horizontal = currentBanner.textAlign || 'left';
    
    let alignItems = 'center';
    if (vertical === 'top') alignItems = 'flex-start';
    if (vertical === 'bottom') alignItems = 'flex-end';
    
    let justifyContent = 'flex-start';
    if (horizontal === 'center') justifyContent = 'center';
    if (horizontal === 'right') justifyContent = 'flex-end';
    
    return { alignItems, justifyContent };
  };

  const containerAlignment = getContainerAlignment();

  // Get text alignment
  const getTextAlign = () => {
    const align = currentBanner.textAlign || 'left';
    return align;
  };

  // Get button alignment
  const getButtonAlign = () => {
    const align = currentBanner.buttonAlign || 'left';
    if (align === 'center') return 'center';
    if (align === 'right') return 'flex-end';
    return 'flex-start';
  };

  const getTitleClass = () => {
    const size = currentBanner.titleSize || 'lg';
    const base = size === 'sm'
      ? 'text-3xl md:text-4xl mb-4'
      : size === 'md'
      ? 'text-4xl md:text-5xl mb-4'
      : 'text-4xl md:text-6xl mb-4';
    const weight = currentBanner.titleBold ?? true ? ' font-bold' : ' font-normal';
    const style = currentBanner.titleItalic ? ' italic' : '';
    return base + weight + style;
  };

  const getSubtitleClass = () => {
    const size = currentBanner.subtitleSize || 'md';
    const base = size === 'sm'
      ? 'text-lg md:text-xl mb-6'
      : size === 'lg'
      ? 'text-2xl md:text-3xl mb-8'
      : 'text-xl md:text-2xl mb-8';
    const weight = currentBanner.subtitleBold ? ' font-semibold' : ' font-normal';
    const style = currentBanner.subtitleItalic ? ' italic' : '';
    return base + weight + style;
  };

  return (
    <section className="mb-12 relative">
      <div className="relative h-[400px] md:h-[500px] overflow-hidden">
        {/* Banner Image */}
        {currentBanner.image.startsWith('data:image') ? (
          <img
            src={currentBanner.image}
            alt={currentBanner.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={currentBanner.image}
            alt={currentBanner.title}
            fill
            className="object-cover"
            priority
          />
        )}

        {/* Overlay with Content */}
        <div
          className="absolute inset-0 bg-black bg-opacity-40 flex p-8"
          style={{
            alignItems: containerAlignment.alignItems,
            justifyContent: containerAlignment.justifyContent,
          }}
        >
          <div 
            className="text-white px-4 max-w-3xl w-full flex flex-col"
            style={{
              textAlign: getTextAlign(),
            }}
          >
            {/* Text Content - ALWAYS first */}
            <div className="order-1">
              <h1
                className={getTitleClass()}
                style={{ color: currentBanner.titleColor || '#ffffff' }}
              >
                {currentBanner.title}
              </h1>
              <p
                className={getSubtitleClass()}
                style={{ color: currentBanner.subtitleColor || '#e5e7eb' }}
              >
                {currentBanner.subtitle}
              </p>
            </div>
            
            {/* Button - ALWAYS below text, positioned based on buttonAlign */}
            <div 
              className="flex w-full order-2 mt-4"
              style={{
                justifyContent: getButtonAlign(),
              }}
            >
              <a
                href={currentBanner.ctaLink}
                className="inline-block px-8 py-3 rounded-lg font-semibold hover:bg-opacity-90 transition"
                style={{
                  backgroundColor: currentBanner.buttonBgColor || '#ffffff',
                  color: currentBanner.buttonTextColor || '#111827',
                }}
              >
                {currentBanner.ctaLabel}
              </a>
            </div>
          </div>
        </div>

        {/* Dots Indicator */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 z-10">
            {banners.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-8'
                    : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                }`}
                aria-label={`Go to banner ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
