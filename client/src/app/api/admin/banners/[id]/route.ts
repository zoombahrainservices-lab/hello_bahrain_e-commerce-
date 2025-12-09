import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { uploadBase64Image } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// PUT /api/admin/banners/:id - Update banner
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;
    const bannerData = await request.json();

    const updateData: any = {};
    if (bannerData.title !== undefined) updateData.title = bannerData.title;
    if (bannerData.subtitle !== undefined) updateData.subtitle = bannerData.subtitle;
    if (bannerData.ctaLabel !== undefined) updateData.cta_label = bannerData.ctaLabel;
    if (bannerData.active !== undefined) updateData.active = bannerData.active;

    // Handle image upload
    if (bannerData.image !== undefined) {
      updateData.image = await uploadBase64Image(bannerData.image, 'banners');
    }

    // Handle alignment data in cta_link
    if (bannerData.ctaLink !== undefined) {
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
      updateData.cta_link = `${bannerData.ctaLink}|||${JSON.stringify(alignmentData)}`;
    }

    if (bannerData.displayOrder !== undefined) {
      updateData.display_order = bannerData.displayOrder;
    }

    const { data, error } = await getSupabase()
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Banner not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Extract alignment data for response
    const linkParts = data.cta_link?.split('|||') || [data.cta_link || '/'];
    const actualLink = linkParts[0];
    let alignment: any = {
      textAlign: 'left',
      textVertical: 'middle',
      buttonAlign: 'left',
      buttonVertical: 'middle',
      displayOrder: 0,
    };

    if (linkParts[1]) {
      try {
        alignment = JSON.parse(linkParts[1]);
      } catch (e) {
        // Invalid JSON
      }
    }

    const response = {
      _id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      ctaLabel: data.cta_label,
      ctaLink: actualLink,
      image: data.image,
      active: data.active,
      textAlign: alignment.textAlign || 'left',
      textVertical: alignment.textVertical || 'middle',
      buttonAlign: alignment.buttonAlign || 'left',
      buttonVertical: alignment.buttonVertical || 'middle',
      displayOrder: alignment.displayOrder || 0,
      titleColor: alignment.titleColor || '#ffffff',
      subtitleColor: alignment.subtitleColor || '#e5e7eb',
      buttonBgColor: alignment.buttonBgColor || '#ffffff',
      buttonTextColor: alignment.buttonTextColor || '#111827',
      titleSize: alignment.titleSize || 'lg',
      subtitleSize: alignment.subtitleSize || 'md',
      titleBold: alignment.titleBold ?? true,
      titleItalic: alignment.titleItalic ?? false,
      subtitleBold: alignment.subtitleBold ?? false,
      subtitleItalic: alignment.subtitleItalic ?? false,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating banner:', error);
    return NextResponse.json(
      { message: 'Error updating banner', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/banners/:id - Delete banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    const { error } = await getSupabase()
      .from('banners')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Banner not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Banner deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    return NextResponse.json(
      { message: 'Error deleting banner', error: error?.message },
      { status: 500 }
    );
  }
}

