import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';
import { getBannerMediaUrl } from '@/lib/media/storefront-media-service';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache
export const runtime = 'nodejs'; // Use Node.js runtime (not edge)

// GET /api/banners/active - Get active banners
export async function GET(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('🎨 [Banners API] Fetching active banners from database at', new Date().toISOString());
    
    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Banners API] Database error:', error);
      throw error;
    }
    
    console.log('✅ [Banners API] Fetched', data?.length || 0, 'active banners from database');

    if (!data || data.length === 0) {
      return NextResponse.json([], {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // Extract displayOrder from alignment data and sort
    const bannersWithOrder = data.map((banner: any) => {
      const ctaLink = banner.cta_link || '';
      const linkParts = ctaLink.split('|||');
      let displayOrder = 0;
      
      if (linkParts[1]) {
        try {
          const alignmentData = JSON.parse(linkParts[1]);
          displayOrder = alignmentData.displayOrder || 0;
        } catch (e) {
          // Invalid JSON, use default
        }
      }
      
      return { ...banner, _displayOrder: displayOrder };
    });

    // Sort by displayOrder (lower numbers first), then by created_at
    bannersWithOrder.sort((a: any, b: any) => {
      if (a._displayOrder !== b._displayOrder) {
        return a._displayOrder - b._displayOrder;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    // Resolve hero variant URLs for banners that have a media_id
    const mediaIds = bannersWithOrder
      .map((b: any) => b.media_id)
      .filter(Boolean) as string[];
    const heroUrlMap: Record<string, string | null> = {};
    await Promise.all(
      mediaIds.map(async (id: string) => {
        heroUrlMap[id] = await getBannerMediaUrl(id);
      }),
    );

    // Transform banners to camelCase for frontend
    const transformedBanners = bannersWithOrder.map((banner: any) => {
      // Extract alignment data from cta_link if it exists
      const ctaLink = banner.cta_link || '';
      const linkParts = ctaLink.split('|||');
      const actualLink = linkParts[0] || '';
      let alignmentData: any = {
        textAlign: 'left',
        textVertical: 'middle',
        buttonAlign: 'left',
        buttonVertical: 'middle',
        displayOrder: 0,
        titleColor: '#ffffff',
        subtitleColor: '#e5e7eb',
        buttonBgColor: '#ffffff',
        buttonTextColor: '#111827',
        titleSize: 'lg',
        subtitleSize: 'md',
        titleBold: true,
        titleItalic: false,
        subtitleBold: false,
        subtitleItalic: false,
      };

      if (linkParts[1]) {
        try {
          alignmentData = JSON.parse(linkParts[1]);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }

      // Use the resolved hero variant URL when available, fall back to stored image URL
      const resolvedImage =
        (banner.media_id && heroUrlMap[banner.media_id]) || banner.image;

      return {
        _id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.cta_label,
        ctaLink: actualLink,
        image: resolvedImage,
        mediaId: banner.media_id ?? null,
        active: banner.active,
        textAlign: alignmentData.textAlign || 'left',
        textVertical: alignmentData.textVertical || 'middle',
        buttonAlign: alignmentData.buttonAlign || 'left',
        buttonVertical: alignmentData.buttonVertical || 'middle',
        displayOrder: alignmentData.displayOrder || 0,
        titleColor: alignmentData.titleColor || '#ffffff',
        subtitleColor: alignmentData.subtitleColor || '#e5e7eb',
        buttonBgColor: alignmentData.buttonBgColor || '#ffffff',
        buttonTextColor: alignmentData.buttonTextColor || '#111827',
        titleSize: alignmentData.titleSize || 'lg',
        subtitleSize: alignmentData.subtitleSize || 'md',
        titleBold: alignmentData.titleBold ?? true,
        titleItalic: alignmentData.titleItalic ?? false,
        subtitleBold: alignmentData.subtitleBold ?? false,
        subtitleItalic: alignmentData.subtitleItalic ?? false,
      };
    });

    // Add cache-busting headers to ensure fresh data
    return NextResponse.json(transformedBanners, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    const errorMessage = error?.message || 'Error fetching banners';
    const errorDetails = {
      message: errorMessage,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    };
    return NextResponse.json(
      { message: errorMessage, error: errorDetails },
      { status: 500 }
    );
  }
}

