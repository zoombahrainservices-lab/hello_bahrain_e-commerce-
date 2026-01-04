import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { uploadBase64Image, uploadMultipleBase64Images } from '@/lib/storage';

export const dynamic = 'force-dynamic';

// GET /api/admin/products/:id - Get single product by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    const { data, error } = await getSupabase()
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Product not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Transform to match frontend expectations
    const product = {
      _id: data.id,
      id: data.id,
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: data.price,
      category: data.category,
      tags: data.tags || [],
      image: data.image,
      images: data.images || [],
      inStock: data.in_stock,
      in_stock: data.in_stock,
      stockQuantity: data.stock_quantity,
      stock_quantity: data.stock_quantity,
      rating: data.rating,
      isFeatured: data.is_featured,
      is_featured: data.is_featured,
      isNew: data.is_new,
      is_new: data.is_new,
      createdAt: data.created_at,
      created_at: data.created_at,
      updatedAt: data.updated_at,
      updated_at: data.updated_at,
    };

    return NextResponse.json(product);
  } catch (error: any) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { message: 'Error fetching product', error: error?.message },
      { status: 500 }
    );
  }
}

// PUT /api/admin/products/:id - Update product
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;
    const productData = await request.json();

    // Transform data to match database schema
    const updateData: any = {};
    if (productData.name !== undefined) updateData.name = productData.name;
    if (productData.slug !== undefined) updateData.slug = productData.slug;
    if (productData.description !== undefined) updateData.description = productData.description;
    if (productData.price !== undefined) updateData.price = productData.price;
    if (productData.category !== undefined) updateData.category = productData.category;
    if (productData.tags !== undefined) updateData.tags = productData.tags;
    if (productData.image !== undefined) {
      updateData.image = await uploadBase64Image(productData.image, 'products');
    }
    if (productData.images !== undefined) {
      updateData.images = await uploadMultipleBase64Images(productData.images, 'products');
    }
    if (productData.inStock !== undefined) updateData.in_stock = productData.inStock;
    if (productData.stockQuantity !== undefined) updateData.stock_quantity = productData.stockQuantity;
    if (productData.rating !== undefined) updateData.rating = productData.rating;
    if (productData.isFeatured !== undefined) updateData.is_featured = productData.isFeatured;
    if (productData.isNew !== undefined) updateData.is_new = productData.isNew;

    const { data, error } = await getSupabase()
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Product not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    // Transform back to camelCase
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

    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { message: 'Error updating product', error: error?.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/products/:id - Delete product
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;

    const { error } = await getSupabase()
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Product not found' },
          { status: 404 }
        );
      }
      throw error;
    }

    return NextResponse.json({ message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { message: 'Error deleting product', error: error?.message },
      { status: 500 }
    );
  }
}


