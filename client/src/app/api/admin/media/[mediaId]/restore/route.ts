import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { restoreMedia } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/media/[mediaId]/restore
export async function POST(
  request: NextRequest,
  { params }: { params: { mediaId: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    await restoreMedia(params.mediaId);
    return NextResponse.json({ message: 'Media restored successfully.' });
  } catch (err: any) {
    console.error(`POST /api/admin/media/${params.mediaId}/restore error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to restore media.' }, { status: 500 });
  }
}
