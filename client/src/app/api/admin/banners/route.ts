import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { uploadBase64Image } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET /api/admin/banners - Get all banners
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to camelCase for frontend
    const transformedBanners = (data || []).map((banner: any) => {
      // Extract alignment data from cta_link if it exists
      const linkParts = banner.cta_link?.split('|||') || [banner.cta_link || '/'];
      const actualLink = linkParts[0];
      let savedAlignment: any = {
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
          savedAlignment = JSON.parse(linkParts[1]);
        } catch (e) {
          // Invalid JSON, use defaults
        }
      }

      return {
        _id: banner.id,
        title: banner.title,
        subtitle: banner.subtitle,
        ctaLabel: banner.cta_label,
        ctaLink: actualLink,
        image: banner.image,
        active: banner.active,
        textAlign: savedAlignment.textAlign || 'left',
        textVertical: savedAlignment.textVertical || 'middle',
        buttonAlign: savedAlignment.buttonAlign || 'left',
        buttonVertical: savedAlignment.buttonVertical || 'middle',
        displayOrder: savedAlignment.displayOrder || 0,
        titleColor: savedAlignment.titleColor || '#ffffff',
        subtitleColor: savedAlignment.subtitleColor || '#e5e7eb',
        buttonBgColor: savedAlignment.buttonBgColor || '#ffffff',
        buttonTextColor: savedAlignment.buttonTextColor || '#111827',
        titleSize: savedAlignment.titleSize || 'lg',
        subtitleSize: savedAlignment.subtitleSize || 'md',
        titleBold: savedAlignment.titleBold ?? true,
        titleItalic: savedAlignment.titleItalic ?? false,
        subtitleBold: savedAlignment.subtitleBold ?? false,
        subtitleItalic: savedAlignment.subtitleItalic ?? false,
        createdAt: banner.created_at,
        updatedAt: banner.updated_at,
      };
    });

    return NextResponse.json(transformedBanners);
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    return NextResponse.json(
      { message: 'Error fetching banners', error: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/banners - Create banner
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const bannerData = await request.json();

    // Upload banner image to Supabase Storage
    const bannerImageUrl = await uploadBase64Image(bannerData.image, 'banners');

    // Store alignment settings in the cta_link field
    let finalCtaLink = bannerData.ctaLink || '/';
    const alignmentData = {
      textAlign: bannerData.textAlign || 'left',
      textVertical: bannerData.textVertical || 'middle',
      buttonAlign: bannerData.buttonAlign || 'left',
      buttonVertical: bannerData.buttonVertical || 'middle',
      displayOrder: bannerData.displayOrder || 0,
      titleColor: bannerData.titleColor || '#ffffff',
      subtitleColor: bannerData.subtitleColor || '#e5e7eb',
      buttonBgColor: bannerData.buttonBgColor || '#ffffff',
      buttonTextColor: bannerData.buttonTextColor || '#111827',
      titleSize: bannerData.titleSize || 'lg',
      subtitleSize: bannerData.subtitleSize || 'md',
      titleBold: bannerData.titleBold ?? true,
      titleItalic: bannerData.titleItalic ?? false,
      subtitleBold: bannerData.subtitleBold ?? false,
      subtitleItalic: bannerData.subtitleItalic ?? false,
    };
    
    // Append alignment data to link
    finalCtaLink = `${bannerData.ctaLink}|||${JSON.stringify(alignmentData)}`;

    const insertData: any = {
      title: bannerData.title,
      subtitle: bannerData.subtitle,
      cta_label: bannerData.ctaLabel,
      cta_link: finalCtaLink,
      image: bannerImageUrl,
      active: bannerData.active !== undefined ? bannerData.active : true,
    };

    // Note: display_order column doesn't exist in database
    // displayOrder is stored in alignmentData JSON within cta_link
    // Do NOT try to insert display_order as a separate column

    const { data, error } = await getSupabase()
      .from('banners')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Extract alignment data from cta_link for response
    const createLinkParts = data.cta_link.split('|||');
    const createActualLink = createLinkParts[0];
    let createAlignment: any = alignmentData;

    if (createLinkParts[1]) {
      try {
        createAlignment = JSON.parse(createLinkParts[1]);
      } catch (e) {
        // Invalid JSON, use defaults
      }
    }

    const response = {
      _id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      ctaLabel: data.cta_label,
      ctaLink: createActualLink,
      image: data.image,
      active: data.active,
      textAlign: createAlignment.textAlign || 'left',
      textVertical: createAlignment.textVertical || 'middle',
      buttonAlign: createAlignment.buttonAlign || 'left',
      buttonVertical: createAlignment.buttonVertical || 'middle',
      displayOrder: createAlignment.displayOrder || 0,
      titleColor: createAlignment.titleColor || '#ffffff',
      subtitleColor: createAlignment.subtitleColor || '#e5e7eb',
      buttonBgColor: createAlignment.buttonBgColor || '#ffffff',
      buttonTextColor: createAlignment.buttonTextColor || '#111827',
      titleSize: createAlignment.titleSize || 'lg',
      subtitleSize: createAlignment.subtitleSize || 'md',
      titleBold: createAlignment.titleBold ?? true,
      titleItalic: createAlignment.titleItalic ?? false,
      subtitleBold: createAlignment.subtitleBold ?? false,
      subtitleItalic: createAlignment.subtitleItalic ?? false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { message: 'Error creating banner', error: error?.message },
      { status: 500 }
    );
  }
}

