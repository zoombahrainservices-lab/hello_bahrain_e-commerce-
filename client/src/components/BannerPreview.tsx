'use client';

import Image from 'next/image';
import { useEffect } from 'react';

interface BannerPreviewProps {
  banner: {
    title: string;
    subtitle: string;
    ctaLabel: string;
    ctaLink: string;
    image: string;
    textAlign?: 'left' | 'center' | 'right';
    textVertical?: 'top' | 'middle' | 'bottom';
    buttonAlign?: 'left' | 'center' | 'right';
    buttonVertical?: 'top' | 'middle' | 'bottom';
    titleColor?: string;
    subtitleColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    titleSize?: 'sm' | 'md' | 'lg';
    subtitleSize?: 'sm' | 'md' | 'lg';
    titleBold?: boolean;
    titleItalic?: boolean;
    subtitleBold?: boolean;
    subtitleItalic?: boolean;
  };
}

export default function BannerPreview({ banner }: BannerPreviewProps) {
  // Debug: Log whenever banner prop changes
  useEffect(() => {
    console.log('🎨 BannerPreview received banner:', {
      textAlign: banner.textAlign,
      textVertical: banner.textVertical,
      buttonAlign: banner.buttonAlign,
      buttonVertical: banner.buttonVertical,
    });
  }, [banner.textAlign, banner.textVertical, banner.buttonAlign, banner.buttonVertical]);

  // Get container flex alignment based on text position
  const getContainerAlignment = () => {
    const vertical = banner.textVertical || 'middle';
    const horizontal = banner.textAlign || 'left';
    
    let alignItems = 'center';
    if (vertical === 'top') alignItems = 'flex-start';
    if (vertical === 'bottom') alignItems = 'flex-end';
    
    let justifyContent = 'flex-start';
    if (horizontal === 'center') justifyContent = 'center';
    if (horizontal === 'right') justifyContent = 'flex-end';
    
    console.log('📐 Container alignment:', { alignItems, justifyContent, vertical, horizontal });
    return { alignItems, justifyContent };
  };

  const containerAlignment = getContainerAlignment();

  // Get text alignment
  const getTextAlign = () => {
    const align = banner.textAlign || 'left';
    console.log('📝 Text align:', align);
    return align;
  };

  // Get button alignment
  const getButtonAlign = () => {
    const align = banner.buttonAlign || 'left';
    let result = 'flex-start';
    if (align === 'center') result = 'center';
    if (align === 'right') result = 'flex-end';
    console.log('🔘 Button align:', { input: align, output: result });
    return result;
  };

  const getTitleClass = () => {
    const size = banner.titleSize || 'lg';
    const base = size === 'sm'
      ? 'text-xl md:text-3xl mb-2'
      : size === 'md'
      ? 'text-2xl md:text-4xl mb-2'
      : 'text-3xl md:text-5xl mb-2';
    const weight = banner.titleBold ?? true ? ' font-bold' : ' font-normal';
    const style = banner.titleItalic ? ' italic' : '';
    return base + weight + style;
  };

  const getSubtitleClass = () => {
    const size = banner.subtitleSize || 'md';
    const base = size === 'sm'
      ? 'text-sm md:text-base mb-3'
      : size === 'lg'
      ? 'text-lg md:text-2xl mb-4'
      : 'text-base md:text-lg mb-4';
    const weight = banner.subtitleBold ? ' font-semibold' : ' font-normal';
    const style = banner.subtitleItalic ? ' italic' : '';
    return base + weight + style;
  };

  return (
    <div className="relative h-[300px] md:h-[400px] overflow-hidden border-2 border-gray-300 rounded-lg">
      {/* Banner Image */}
      {banner.image ? (
        banner.image.startsWith('data:image') ? (
          <img
            src={banner.image}
            alt={banner.title || 'Banner preview'}
            className="w-full h-full object-cover"
          />
        ) : (
          <Image
            src={banner.image}
            alt={banner.title || 'Banner preview'}
            fill
            className="object-cover"
          />
        )
      ) : (
        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
          <p className="text-gray-400">No image</p>
        </div>
      )}

      {/* Overlay with Content */}
      {banner.title && (
        <div
          className="absolute inset-0 bg-black bg-opacity-40 flex p-6"
          style={{
            alignItems: containerAlignment.alignItems,
            justifyContent: containerAlignment.justifyContent,
          }}
        >
          <div 
            className="text-white px-4 max-w-2xl w-full flex flex-col"
            style={{
              textAlign: getTextAlign(),
            }}
          >
            {/* Text Content - ALWAYS first */}
            <div className="order-1">
              <h1
                className={getTitleClass()}
                style={{ color: banner.titleColor || '#ffffff' }}
              >
                {banner.title}
              </h1>
              <p
                className={getSubtitleClass()}
                style={{ color: banner.subtitleColor || '#e5e7eb' }}
              >
                {banner.subtitle}
              </p>
            </div>
            
            {/* Button - ALWAYS below text, positioned based on buttonAlign */}
            {banner.ctaLabel && (
              <div 
                className="flex w-full order-2 mt-2"
                style={{
                  justifyContent: getButtonAlign(),
                }}
              >
                <a
                  href={banner.ctaLink}
                  className="inline-block px-6 py-2 rounded-lg font-semibold hover:bg-opacity-90 transition text-sm"
                  style={{
                    backgroundColor: banner.buttonBgColor || '#ffffff',
                    color: banner.buttonTextColor || '#111827',
                  }}
                >
                  {banner.ctaLabel}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
