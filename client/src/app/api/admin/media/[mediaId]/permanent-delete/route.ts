import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { permanentlyDeleteMedia, getMediaUsages } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// DELETE /api/admin/media/[mediaId]/permanent-delete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { mediaId: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    // Pre-flight usage check — return 409 with details before attempting delete
    const usages = await getMediaUsages(params.mediaId);
    if (usages.length > 0) {
      return NextResponse.json(
        {
          message: `Cannot permanently delete: image is still used by ${usages.length} product(s).`,
          usedByProducts: usages,
        },
        { status: 409 },
      );
    }

    await permanentlyDeleteMedia(params.mediaId);
    return NextResponse.json({ message: 'Media permanently deleted.' });
  } catch (err: any) {
    console.error(`DELETE /api/admin/media/${params.mediaId}/permanent-delete error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to permanently delete media.' }, { status: 500 });
  }
}
