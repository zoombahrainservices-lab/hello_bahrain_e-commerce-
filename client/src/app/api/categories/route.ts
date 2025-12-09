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

    return NextResponse.json(categories);
  } catch (error: any) {
    console.error('Error fetching public categories:', error);
    const errorMessage = error?.message || 'Error fetching categories';
    return NextResponse.json(
      { message: errorMessage, error: error?.stack },
      { status: 500 }
    );
  }
}

