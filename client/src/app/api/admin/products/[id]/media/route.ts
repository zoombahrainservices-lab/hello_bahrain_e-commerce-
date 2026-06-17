import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import {
  getProductMedia,
  attachMediaToProduct,
  setMainProductImage,
  addGalleryImage,
  backfillProductMedia,
} from '@/lib/media/product-media-service';
import { attachMediaSchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/products/[id]/media — list all media attached to product
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    let media = await getProductMedia(params.id);
    if (media.length === 0) {
      await backfillProductMedia(params.id);
      media = await getProductMedia(params.id);
    }
    return NextResponse.json(media);
  } catch (err: any) {
    console.error(`GET /api/admin/products/${params.id}/media error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to get product media.' }, { status: 500 });
  }
}

// POST /api/admin/products/[id]/media — attach a media item to the product
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = attachMediaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { mediaId, role, sortOrder } = parsed.data;

    let result;
    if (role === 'main_image') {
      result = await setMainProductImage(params.id, mediaId);
    } else if (role === 'gallery_image') {
      result = await addGalleryImage(params.id, mediaId);
    } else {
      result = await attachMediaToProduct({
        productId: params.id,
        mediaId,
        role,
        sortOrder,
      });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err: any) {
    console.error(`POST /api/admin/products/${params.id}/media error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to attach media.' }, { status: 500 });
  }
}
