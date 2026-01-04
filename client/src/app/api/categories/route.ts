import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0; // Never cache
export const runtime = 'nodejs'; // Use Node.js runtime (not edge)

// GET /api/categories - public list of product categories
export async function GET(request: NextRequest) {
  try {
    // Log request for debugging
    console.log('📋 [Categories API] Fetching categories from database at', new Date().toISOString());
    
    const { data, error } = await getSupabase()
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('❌ [Categories API] Database error:', error);
      throw error;
    }
    
    console.log('✅ [Categories API] Fetched', data?.length || 0, 'categories from database');

    const categories = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
    }));

    // Add cache-busting headers to ensure fresh data
    return NextResponse.json(categories, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });
  } catch (error: any) {
    console.error('Error fetching public categories:', error);
    console.error('Error details:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
    });
    const errorMessage = error?.message || 'Error fetching categories';
    const errorDetails = {
      message: errorMessage,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    };
    return NextResponse.json(
      { message: errorMessage, error: errorDetails },
      { status: 500 }
    );
  }
}

