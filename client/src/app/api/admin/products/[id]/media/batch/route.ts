import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { attachMultipleMediaToProduct } from '@/lib/media/product-media-service';
import { attachMediaBatchSchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/products/[id]/media/batch — attach multiple media items
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = attachMediaBatchSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const media = await attachMultipleMediaToProduct(
      params.id,
      parsed.data.mediaIds,
      { mainMediaId: parsed.data.mainMediaId },
    );

    return NextResponse.json(media, { status: 201 });
  } catch (err: any) {
    console.error(`POST /api/admin/products/${params.id}/media/batch error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to attach media batch.' }, { status: 500 });
  }
}
