import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { backfillMediaVariants } from '@/lib/media/variant-service';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/admin/media/backfill-variants
 *
 * Generate missing optimized variants for existing media library items.
 *
 * Query params:
 *   limit   — batch size (default 50)
 *   offset  — pagination offset (default 0)
 *   dry     — if "true", returns count estimate without processing
 */
export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const { searchParams } = request.nextUrl;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '50', 10) || 50, 200);
  const offset = parseInt(searchParams.get('offset') ?? '0', 10) || 0;
  const dry = searchParams.get('dry') === 'true';

  if (dry) {
    return NextResponse.json({
      message: 'Dry run — use POST without dry=true to process items.',
      limit,
      offset,
    });
  }

  try {
    const report = await backfillMediaVariants({ limit, offset, onlyMissing: true });
    return NextResponse.json({
      message: `Processed ${report.processed} item(s): ${report.succeeded} succeeded, ${report.failed} failed, ${report.totalGenerated} variant(s) generated.`,
      report,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Backfill failed';
    return NextResponse.json({ message }, { status: 500 });
  }
}
