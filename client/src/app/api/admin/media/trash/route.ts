import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { listTrashedMedia, emptyTrash, countTrashedMedia } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET /api/admin/media/trash — list trashed items (also auto-purges >60 day items)
export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const countOnly = new URL(request.url).searchParams.get('countOnly') === 'true';

  try {
    if (countOnly) {
      const count = await countTrashedMedia();
      return NextResponse.json({ count });
    }
    const items = await listTrashedMedia();
    return NextResponse.json({ items, total: items.length });
  } catch (err: any) {
    console.error('GET /api/admin/media/trash error:', err);
    return NextResponse.json({ message: err?.message ?? 'Failed to list trash' }, { status: 500 });
  }
}

// DELETE /api/admin/media/trash — empty the entire trash
export async function DELETE(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const deleted = await emptyTrash();
    return NextResponse.json({ message: `Trash emptied. ${deleted} item${deleted !== 1 ? 's' : ''} permanently deleted.`, deleted });
  } catch (err: any) {
    console.error('DELETE /api/admin/media/trash error:', err);
    return NextResponse.json({ message: err?.message ?? 'Failed to empty trash' }, { status: 500 });
  }
}
