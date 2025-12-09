import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/categories - public list of product categories
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await getSupabase()
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

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

