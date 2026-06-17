import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { setProductMediaOrder } from '@/lib/media/product-media-service';
import { syncProductMediaOrderSchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// PUT /api/admin/products/[id]/media/order — sync full image group (main + gallery order)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const body = await request.json();
    const parsed = syncProductMediaOrderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid request body', errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const media = await setProductMediaOrder(params.id, parsed.data.orderedMediaIds);
    return NextResponse.json(media);
  } catch (err: any) {
    console.error(`PUT /api/admin/products/${params.id}/media/order error:`, err);
    return NextResponse.json({ message: err?.message ?? 'Failed to update product media order.' }, { status: 500 });
  }
}
