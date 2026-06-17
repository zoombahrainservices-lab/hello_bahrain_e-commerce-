import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { listMedia, listFolders } from '@/lib/media/media-service';
import { mediaListSchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/media — list media items with filters, search, pagination
export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const { searchParams } = new URL(request.url);
    const parsed = mediaListSchema.safeParse(Object.fromEntries(searchParams));

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Special case: if asking for folders list
    if (searchParams.get('resource') === 'folders') {
      const folders = await listFolders();
      return NextResponse.json(folders);
    }

    const result = await listMedia(parsed.data);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('GET /api/admin/media error:', err);
    return NextResponse.json({ message: err?.message ?? 'Failed to list media' }, { status: 500 });
  }
}
