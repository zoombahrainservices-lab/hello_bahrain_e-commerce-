import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { listProductMediaGroups } from '@/lib/media/product-media-groups';
import { organizeAllProductMedia } from '@/lib/media/product-media-organize';
import { z } from 'zod';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

const querySchema = z.object({
  q: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(48),
  sort: z.enum(['newest', 'oldest', 'name_asc', 'name_desc']).optional().default('newest'),
  sync: z.enum(['true', 'false']).optional().default('false'),
});

/**
 * GET /api/admin/media/product-groups
 * One card per product in the Products folder view.
 * Pass sync=true only for explicit migration (POST /api/admin/products/organize-media is preferred).
 */
export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const parsed = querySchema.safeParse(Object.fromEntries(request.nextUrl.searchParams));
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid query parameters', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Return grouped cards immediately; optional sync runs in the background.
    if (parsed.data.sync === 'true') {
      void organizeAllProductMedia().catch((err) => {
        console.error('Background product media organize failed:', err);
      });
    }

    const result = await listProductMediaGroups({
      q: parsed.data.q,
      page: parsed.data.page,
      limit: parsed.data.limit,
      sort: parsed.data.sort,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('GET /api/admin/media/product-groups error:', err);
    return NextResponse.json(
      { message: err?.message ?? 'Failed to load product groups.' },
      { status: 500 },
    );
  }
}
