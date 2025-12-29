import { NextRequest, NextResponse } from 'next/server';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

// GET /api/products - Public product listing with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const sort = searchParams.get('sort') || 'newest';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '12', 10);

    const query: any = {
      search: search || undefined,
      category: category || undefined,
      sort: sort,
      page,
      limit,
    };

    const result = await supabaseHelpers.searchProducts(query);

    const totalPages = Math.ceil(result.count / limit);

    // Transform products to camelCase for frontend
    const transformedItems = (result.data || []).map((product: any) => ({
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
      promotionalLabel: product.promotional_label,
      promotionalLabelColor: product.promotional_label_color,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    }));

    const response = NextResponse.json({
      items: transformedItems,
      total: result.count,
      page,
      totalPages,
      limit,
    });
    return cors.addHeaders(response, request);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    const errorMessage = error?.message || 'Error fetching products';
    const errorDetails = {
      message: errorMessage,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    };
    const errorResponse = NextResponse.json(
      { message: errorMessage, error: errorDetails },
      { status: 500 }
    );
    return cors.addHeaders(errorResponse, request);
  }
}

