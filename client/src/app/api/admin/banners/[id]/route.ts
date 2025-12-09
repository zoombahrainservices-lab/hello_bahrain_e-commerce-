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
    if (!id) {
      return NextResponse.json(
        { message: 'Banner ID is required' },
        { status: 400 }
      );
    }

    const bannerData = await request.json();

    // First, get current banner to preserve cta_link if not provided
    const { data: currentBanner, error: fetchError } = await getSupabase()
      .from('banners')
      .select('cta_link')
      .eq('id', id)
      .single();

    // If banner doesn't exist, return 404
    if (fetchError && fetchError.code === 'PGRST116') {
      return NextResponse.json(
        { message: 'Banner not found' },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (bannerData.title !== undefined) updateData.title = bannerData.title;
    if (bannerData.subtitle !== undefined) updateData.subtitle = bannerData.subtitle;
    if (bannerData.ctaLabel !== undefined) updateData.cta_label = bannerData.ctaLabel;
    if (bannerData.active !== undefined) updateData.active = bannerData.active;

    // Handle image upload - only if image is provided and it's a new base64 image
    if (bannerData.image !== undefined && bannerData.image) {
      try {
        updateData.image = await uploadBase64Image(bannerData.image, 'banners');
      } catch (imageError: any) {
        console.error('Error uploading image:', imageError);
        return NextResponse.json(
          { message: 'Error uploading image', error: imageError?.message },
          { status: 500 }
        );
      }
    }

    // Always update alignment data in cta_link (even if ctaLink itself hasn't changed)
    // Get the current link from existing banner or use the new one
    let currentLink = bannerData.ctaLink;
    if (currentLink === undefined || currentLink === '') {
      // Try to get from existing banner
      if (currentBanner?.cta_link) {
        // Extract current link from existing cta_link (remove alignment data)
        const linkParts = currentBanner.cta_link.split('|||');
        currentLink = linkParts[0] || '/';
      } else {
        currentLink = '/';
      }
    }
    currentLink = currentLink || '/';

    // Build alignment data from form data
    const alignmentData = {
      textAlign: bannerData.textAlign !== undefined ? bannerData.textAlign : 'left',
      textVertical: bannerData.textVertical !== undefined ? bannerData.textVertical : 'middle',
      buttonAlign: bannerData.buttonAlign !== undefined ? bannerData.buttonAlign : 'left',
      buttonVertical: bannerData.buttonVertical !== undefined ? bannerData.buttonVertical : 'middle',
      displayOrder: bannerData.displayOrder !== undefined ? bannerData.displayOrder : 0,
      titleColor: bannerData.titleColor !== undefined ? bannerData.titleColor : '#ffffff',
      subtitleColor: bannerData.subtitleColor !== undefined ? bannerData.subtitleColor : '#e5e7eb',
      buttonBgColor: bannerData.buttonBgColor !== undefined ? bannerData.buttonBgColor : '#ffffff',
      buttonTextColor: bannerData.buttonTextColor !== undefined ? bannerData.buttonTextColor : '#111827',
      titleSize: bannerData.titleSize !== undefined ? bannerData.titleSize : 'lg',
      subtitleSize: bannerData.subtitleSize !== undefined ? bannerData.subtitleSize : 'md',
      titleBold: bannerData.titleBold !== undefined ? bannerData.titleBold : true,
      titleItalic: bannerData.titleItalic !== undefined ? bannerData.titleItalic : false,
      subtitleBold: bannerData.subtitleBold !== undefined ? bannerData.subtitleBold : false,
      subtitleItalic: bannerData.subtitleItalic !== undefined ? bannerData.subtitleItalic : false,
    };
    
    // Always update cta_link with alignment data
    updateData.cta_link = `${currentLink}|||${JSON.stringify(alignmentData)}`;

    if (bannerData.displayOrder !== undefined) {
      updateData.display_order = bannerData.displayOrder;
    }

    // Make sure we have something to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { message: 'No data provided to update' },
        { status: 400 }
      );
    }

    const { data, error } = await getSupabase()
      .from('banners')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Banner not found' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { message: 'Error updating banner', error: error.message, code: error.code },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { message: 'Banner not found after update' },
        { status: 404 }
      );
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

