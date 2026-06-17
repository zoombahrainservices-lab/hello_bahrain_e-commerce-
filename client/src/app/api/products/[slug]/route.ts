import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { transformProductForStorefront } from '@/lib/products/storefront-transform';

export const dynamic = 'force-dynamic';

// GET /api/products/:slug - Get single product by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    const product = await supabaseHelpers.findProductBySlug(slug);

    if (!product) {
      return NextResponse.json(
        { message: 'Product not found' },
        { status: 404 }
      );
    }

    const transformedProduct = await transformProductForStorefront(product);

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Error fetching product' },
      { status: 500 }
    );
  }
}


