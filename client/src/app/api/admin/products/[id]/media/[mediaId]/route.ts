import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { removeMediaFromProduct } from '@/lib/media/product-media-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// DELETE /api/admin/products/[id]/media/[mediaId] — remove media from product
// Does NOT delete the media item itself from the library.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; mediaId: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await removeMediaFromProduct(params.id, params.mediaId);
    return NextResponse.json({ message: 'Media removed from product.' });
  } catch (err: any) {
    console.error(
      `DELETE /api/admin/products/${params.id}/media/${params.mediaId} error:`,
      err,
    );
    return NextResponse.json(
      { message: err?.message ?? 'Failed to remove media from product.' },
      { status: 500 },
    );
  }
}
