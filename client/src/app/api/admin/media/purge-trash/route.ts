import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { TRASH_RETENTION_DAYS } from '@/lib/media/media-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/admin/media/purge-trash
 *
 * Permanently deletes all media_items that have been in trash for >= TRASH_RETENTION_DAYS days.
 * Also removes their R2 files and variant rows.
 *
 * Safe to call via Vercel Cron or the Media Tools admin page.
 * Returns a summary of items purged.
 */
export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = getSupabase();

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);

  const { data: expired, error } = await supabase
    .from('media_items')
    .select('id, storage_path, original_file_name')
    .eq('status', 'trashed')
    .lt('deleted_at', cutoff.toISOString());

  if (error) {
    return NextResponse.json({ message: `Failed to query trash: ${error.message}` }, { status: 500 });
  }

  if (!expired || expired.length === 0) {
    return NextResponse.json({
      message: `No items older than ${TRASH_RETENTION_DAYS} days found in trash.`,
      purged: 0,
    });
  }

  const ids = expired.map((r: any) => r.id);

  // Fetch variant storage paths
  const { data: variantRows } = await supabase
    .from('media_variants')
    .select('storage_path')
    .in('media_id', ids);

  const allPaths = [
    ...expired.map((r: any) => r.storage_path),
    ...((variantRows ?? []) as { storage_path: string }[]).map((v) => v.storage_path),
  ];

  // Delete R2 files
  const { deleteFromR2 } = await import('@/lib/media/r2');
  let r2Errors = 0;
  for (const p of [...new Set(allPaths)]) {
    try {
      await deleteFromR2(p);
    } catch {
      r2Errors++;
    }
  }

  // Delete DB rows
  await supabase.from('media_variants').delete().in('media_id', ids);
  await supabase.from('media_usages').delete().in('media_id', ids);
  const { error: deleteError } = await supabase.from('media_items').delete().in('id', ids);

  if (deleteError) {
    return NextResponse.json({ message: `Failed to delete items: ${deleteError.message}` }, { status: 500 });
  }

  return NextResponse.json({
    message: `Purged ${ids.length} item(s) from trash (older than ${TRASH_RETENTION_DAYS} days). ${r2Errors > 0 ? `${r2Errors} R2 file(s) could not be deleted (non-fatal).` : ''}`,
    purged: ids.length,
    r2Errors,
  });
}
