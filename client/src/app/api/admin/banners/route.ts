import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

function parseBannerRow(banner: any) {
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
    try { savedAlignment = JSON.parse(linkParts[1]); } catch {}
  }

  return {
    _id: banner.id,
    title: banner.title,
    subtitle: banner.subtitle,
    ctaLabel: banner.cta_label,
    ctaLink: actualLink,
    image: banner.image,
    mediaId: banner.media_id ?? null,
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
}

async function resolveMediaUrl(mediaId: string): Promise<string | null> {
  const { data } = await getSupabase()
    .from('media_items')
    .select('public_url')
    .eq('id', mediaId)
    .single();
  return (data as any)?.public_url ?? null;
}

async function upsertBannerUsage(mediaId: string, bannerId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('media_usages')
    .upsert(
      { media_id: mediaId, used_in_type: 'banner', used_in_id: bannerId, used_as: 'hero' },
      { onConflict: 'media_id,used_in_type,used_in_id' },
    );
}

async function deleteBannerUsage(bannerId: string): Promise<void> {
  await getSupabase()
    .from('media_usages')
    .delete()
    .eq('used_in_type', 'banner')
    .eq('used_in_id', bannerId);
}

// GET /api/admin/banners - Get all banners
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) return authResult;

    const { data, error } = await getSupabase()
      .from('banners')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json((data || []).map(parseBannerRow));
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
    if (authResult instanceof NextResponse) return authResult;

    const bannerData = await request.json();

    // Resolve image URL from media library
    let bannerImageUrl: string | null = null;
    const incomingMediaId: string | null = bannerData.mediaId ?? null;

    if (incomingMediaId) {
      bannerImageUrl = await resolveMediaUrl(incomingMediaId);
      if (!bannerImageUrl) {
        return NextResponse.json(
          { message: 'Media item not found' },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { message: 'A media library image (mediaId) is required' },
        { status: 400 }
      );
    }

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
    const finalCtaLink = `${bannerData.ctaLink || '/'}|||${JSON.stringify(alignmentData)}`;

    const { data, error } = await getSupabase()
      .from('banners')
      .insert({
        title: bannerData.title,
        subtitle: bannerData.subtitle,
        cta_label: bannerData.ctaLabel,
        cta_link: finalCtaLink,
        image: bannerImageUrl,
        media_id: incomingMediaId,
        active: bannerData.active !== undefined ? bannerData.active : true,
      })
      .select()
      .single();

    if (error) throw error;

    // Track usage in media_usages
    await upsertBannerUsage(incomingMediaId, data.id);

    return NextResponse.json(parseBannerRow(data), { status: 201 });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return NextResponse.json(
      { message: 'Error creating banner', error: error?.message },
      { status: 500 }
    );
  }
}

