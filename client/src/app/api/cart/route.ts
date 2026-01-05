import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * GET /api/cart
 * Get user's cart from database
 * 
 * Response:
 * - items: Array<CartItem>
 */
export async function GET(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const supabase = getSupabase();
    
    // Get user's cart from database
    const { data: userCart, error } = await supabase
      .from('user_carts')
      .select('items, updated_at')
      .eq('user_id', authResult.user.id)
      .single();

    if (error) {
      // If cart doesn't exist, return empty cart
      if (error.code === 'PGRST116') {
        return cors.addHeaders(
          NextResponse.json({ items: [], updatedAt: null }),
          request
        );
      }
      throw error;
    }

    return cors.addHeaders(
      NextResponse.json({ 
        items: userCart.items || [], 
        updatedAt: userCart.updated_at 
      }),
      request
    );
  } catch (error: any) {
    console.error('[Cart API] GET error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to fetch cart' },
        { status: 500 }
      ),
      request
    );
  }
}

/**
 * POST /api/cart
 * Save user's cart to database
 * 
 * Request body:
 * - items: Array<CartItem>
 * 
 * Response:
 * - success: boolean
 * - updatedAt: string (ISO timestamp)
 */
export async function POST(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const body = await request.json();
    const { items } = body;

    // Validation
    if (!Array.isArray(items)) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Items must be an array' }, { status: 400 }),
        request
      );
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    // Upsert cart (insert or update if exists)
    const { error } = await supabase
      .from('user_carts')
      .upsert({
        user_id: authResult.user.id,
        items: items,
        updated_at: now,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    console.log('[Cart API] Cart saved for user:', authResult.user.id, 'Items:', items.length);

    return cors.addHeaders(
      NextResponse.json({ 
        success: true, 
        updatedAt: now 
      }),
      request
    );
  } catch (error: any) {
    console.error('[Cart API] POST error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to save cart' },
        { status: 500 }
      ),
      request
    );
  }
}

/**
 * DELETE /api/cart
 * Clear user's cart in database
 * 
 * Response:
 * - success: boolean
 */
export async function DELETE(request: NextRequest) {
  try {
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    // Clear cart by setting items to empty array
    const { error } = await supabase
      .from('user_carts')
      .upsert({
        user_id: authResult.user.id,
        items: [],
        updated_at: now,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    console.log('[Cart API] Cart cleared for user:', authResult.user.id);

    return cors.addHeaders(
      NextResponse.json({ success: true }),
      request
    );
  } catch (error: any) {
    console.error('[Cart API] DELETE error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to clear cart' },
        { status: 500 }
      ),
      request
    );
  }
}

