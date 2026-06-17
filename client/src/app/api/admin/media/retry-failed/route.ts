import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { backfillMediaVariants } from '@/lib/media/variant-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 120;

/**
 * POST /api/admin/media/retry-failed
 *
 * Retries variant generation for media_items stuck in 'processing' or 'failed' status.
 * Resets their status to 'active' and runs the backfill for each.
 *
 * Query params:
 *   limit — max items to retry (default 20)
 */
export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10) || 20, 100);

  const supabase = getSupabase();

  // Find items stuck in processing or failed
  const { data: stuckItems, error } = await supabase
    .from('media_items')
    .select('id, original_file_name, status')
    .in('status', ['processing', 'failed'])
    .order('updated_at', { ascending: true })
    .limit(limit);

  if (error) {
    return NextResponse.json({ message: `Failed to query stuck items: ${error.message}` }, { status: 500 });
  }

  if (!stuckItems || stuckItems.length === 0) {
    return NextResponse.json({ message: 'No stuck or failed items found.', retried: 0, report: null });
  }

  const ids = stuckItems.map((r: any) => r.id);

  // Reset status to active so backfill can process them
  await supabase
    .from('media_items')
    .update({ status: 'active', updated_at: new Date().toISOString() })
    .in('id', ids);

  try {
    const report = await backfillMediaVariants({ ids, onlyMissing: false });

    return NextResponse.json({
      message: `Retried ${stuckItems.length} item(s): ${report.succeeded} succeeded, ${report.failed} failed, ${report.totalGenerated} variant(s) generated.`,
      retried: stuckItems.length,
      report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Retry failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
