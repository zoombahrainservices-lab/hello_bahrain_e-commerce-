import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { organizeAllProductMedia } from '@/lib/media/product-media-organize';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 120;

/**
 * POST /api/admin/products/organize-media
 *
 * Links all existing product images to product_media rows,
 * moves matched files into the Products media folder, and syncs usages.
 * Safe to run multiple times.
 */
export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  try {
    const result = await organizeAllProductMedia();
    return NextResponse.json({
      success: true,
      summary: {
        productsProcessed: result.productsProcessed,
        productsLinked: result.productsLinked,
        mediaRegistered: result.mediaRegistered,
        mediaAlreadyInLibrary: result.mediaAlreadyInLibrary,
        foldersUpdated: result.foldersUpdated,
        usagesSynced: result.usagesSynced,
        unmatched: result.unmatched.length,
        errors: result.errors.length,
      },
      unmatched: result.unmatched,
      errors: result.errors,
    });
  } catch (err: any) {
    console.error('POST /api/admin/products/organize-media error:', err);
    return NextResponse.json(
      { message: err?.message ?? 'Failed to organize product media.' },
      { status: 500 },
    );
  }
}
