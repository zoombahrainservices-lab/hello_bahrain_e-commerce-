import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { reorderProductGallery } from '@/lib/media/product-media-service';
import { reorderGallerySchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/products/[id]/media/reorder — reorder gallery images
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = reorderGallerySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    await reorderProductGallery(params.id, parsed.data.items);
    return NextResponse.json({ message: 'Gallery reordered.' });
  } catch (err: any) {
    console.error(`POST /api/admin/products/${params.id}/media/reorder error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to reorder gallery.' }, { status: 500 });
  }
}
