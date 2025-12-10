import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/orders - Get all orders
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    let query = getSupabase()
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email),
        order_items (*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }
    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Transform data to match frontend expectations
    const orders = (data || []).map((order: any) => {
      // Handle user data - Supabase returns it as 'users' from the join
      const userData = order.users || null;
      
      return {
        _id: order.id,
        id: order.id,
        user: userData ? {
          id: userData.id,
          name: userData.name,
          email: userData.email,
        } : order.user_id,
        user_id: order.user_id,
        items: (order.order_items || []).map((item: any) => ({
          product: item.product_id,
          name: item.name || 'Unknown Product',
          price: parseFloat(item.price.toString()),
          quantity: item.quantity,
          image: item.image || '',
        })),
        total: parseFloat(order.total.toString()),
        status: order.status,
        paymentStatus: order.payment_status,
        payment_status: order.payment_status,
        shippingAddress: order.shipping_address,
        shipping_address: order.shipping_address,
        createdAt: order.created_at,
        created_at: order.created_at,
        updatedAt: order.updated_at,
        updated_at: order.updated_at,
      };
    });

    return NextResponse.json(orders);
  } catch (error: any) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Error fetching orders', error: error?.message },
      { status: 500 }
    );
  }
}


