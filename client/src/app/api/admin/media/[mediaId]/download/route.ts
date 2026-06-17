import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getMediaById } from '@/lib/media/media-service';
import { downloadFromR2 } from '@/lib/media/r2';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/media/[mediaId]/download — proxy original file as download
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

    const originalVariant = media.variants.find((v) => v.variant === 'original');
    if (!originalVariant) {
      return NextResponse.json({ message: 'Original file not found.' }, { status: 404 });
    }

    const { buffer, contentType } = await downloadFromR2(originalVariant.storagePath);

    const downloadName = media.originalFileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    return new NextResponse(buffer as unknown as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${downloadName}"`,
        'Content-Length': String(buffer.length),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: any) {
    console.error(`GET /api/admin/media/${params.mediaId}/download error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Download failed.' }, { status: 500 });
  }
}
