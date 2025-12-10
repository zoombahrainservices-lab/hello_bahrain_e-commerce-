import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { uploadBase64Image, uploadMultipleBase64Images } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET /api/admin/products - Get all products for admin
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { data, error } = await getSupabase()
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Transform to match frontend expectations
    const transformedProducts = (data || []).map((product: any) => ({
      _id: product.id,
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price,
      category: product.category,
      tags: product.tags || [],
      image: product.image,
      images: product.images || [],
      inStock: product.in_stock,
      in_stock: product.in_stock,
      stockQuantity: product.stock_quantity,
      stock_quantity: product.stock_quantity,
      rating: product.rating,
      isFeatured: product.is_featured,
      is_featured: product.is_featured,
      isNew: product.is_new,
      is_new: product.is_new,
      createdAt: product.created_at,
      created_at: product.created_at,
      updatedAt: product.updated_at,
      updated_at: product.updated_at,
    }));

    return NextResponse.json(transformedProducts);
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { message: 'Error fetching products', error: error?.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/products - Create product
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const productData = await request.json();

    // Validate required fields
    if (!productData.name || !productData.slug || !productData.price) {
      return NextResponse.json(
        { message: 'Name, slug, and price are required' },
        { status: 400 }
      );
    }

    // Check if slug is unique
    const existing = await supabaseHelpers.findProductBySlug(productData.slug);
    if (existing) {
      return NextResponse.json(
        { message: 'Product with this slug already exists' },
        { status: 400 }
      );
    }

    // Upload images to Supabase Storage and replace base64 with URLs
    const mainImageUrl = await uploadBase64Image(productData.image, 'products');
    const additionalImageUrls = await uploadMultipleBase64Images(productData.images || [], 'products');

    // Transform data to match database schema
    const insertData = {
      name: productData.name,
      slug: productData.slug,
      description: productData.description,
      price: productData.price,
      category: productData.category,
      tags: productData.tags || [],
      image: mainImageUrl,
      images: additionalImageUrls,
      in_stock: productData.inStock !== undefined ? productData.inStock : true,
      stock_quantity: productData.stockQuantity || 0,
      rating: productData.rating || 0,
      is_featured: productData.isFeatured || false,
      is_new: productData.isNew || false,
    };

    const { data, error } = await getSupabase()
      .from('products')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;

    // Transform back to camelCase for response
    const response = {
      _id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags,
      image: data.image,
      images: data.images,
      inStock: data.in_stock,
      stockQuantity: data.stock_quantity,
      rating: data.rating,
      isFeatured: data.is_featured,
      isNew: data.is_new,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { message: 'Error creating product', error: error?.message },
      { status: 500 }
    );
  }
}


