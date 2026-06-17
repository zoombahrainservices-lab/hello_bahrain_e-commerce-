import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { safeDeleteMedia } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/media/[mediaId]/delete — safe delete (blocks if in use)
export async function POST(
  request: NextRequest,
  { params }: { params: { mediaId: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const result = await safeDeleteMedia(params.mediaId, user.id);

    if (!result.deleted) {
      return NextResponse.json(
        {
          message: `This image is used in ${result.usageCount} place${result.usageCount !== 1 ? 's' : ''}. You cannot delete it unless you remove it first.`,
          usageCount: result.usageCount,
          usages: result.usages,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ message: 'Media moved to trash.' });
  } catch (err: any) {
    console.error(`POST /api/admin/media/${params.mediaId}/delete error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to delete media.' }, { status: 500 });
  }
}
