import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getMediaById, updateMediaDetails, getMediaUsages } from '@/lib/media/media-service';
import { mediaUpdateSchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/media/[mediaId] — get a single media item with variants
export async function GET(
  request: NextRequest,
  { params }: { params: { mediaId: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const media = await getMediaById(params.mediaId);
    if (!media) {
      return NextResponse.json({ message: 'Media item not found.' }, { status: 404 });
    }
    const usages = await getMediaUsages(params.mediaId);
    return NextResponse.json({ ...media, usedByProducts: usages, usages });
  } catch (err: any) {
    console.error(`GET /api/admin/media/${params.mediaId} error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to fetch media.' }, { status: 500 });
  }
}

// PATCH /api/admin/media/[mediaId] — update metadata fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: { mediaId: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = mediaUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updated = await updateMediaDetails(params.mediaId, parsed.data);
    return NextResponse.json(updated);
  } catch (err: any) {
    console.error(`PATCH /api/admin/media/${params.mediaId} error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to update media.' }, { status: 500 });
  }
}
