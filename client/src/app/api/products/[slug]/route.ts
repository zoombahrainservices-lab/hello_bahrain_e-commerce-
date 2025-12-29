import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase-helpers';

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

    // Transform to camelCase for frontend
    const transformedProduct = {
      _id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags,
      image: product.image,
      images: product.images,
      inStock: product.in_stock,
      stockQuantity: product.stock_quantity,
      rating: product.rating,
      isFeatured: product.is_featured,
      isNew: product.is_new,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };

    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Error fetching product' },
      { status: 500 }
    );
  }
}


