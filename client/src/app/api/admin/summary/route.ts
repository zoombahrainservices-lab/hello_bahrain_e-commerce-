import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET /api/admin/summary
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get total users
    const { count: totalUsers } = await getSupabase()
      .from('users')
      .select('*', { count: 'exact', head: true });

    // Get total orders
    const { count: totalOrders } = await getSupabase()
      .from('orders')
      .select('*', { count: 'exact', head: true });

    // Get product count
    const { count: productCount } = await getSupabase()
      .from('products')
      .select('*', { count: 'exact', head: true });

    // Get paid orders for revenue calculation
    const { data: paidOrders } = await getSupabase()
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid');

    const totalRevenue = paidOrders?.reduce((sum, order) => sum + parseFloat(order.total.toString()), 0) || 0;

    // Get recent orders
    const { data: recentOrders } = await getSupabase()
      .from('orders')
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email)
      `)
      .order('created_at', { ascending: false })
      .limit(5);

    // Transform orders to match frontend expectations
    const transformedOrders = (recentOrders || []).map((order: any) => {
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
        items: [], // Will be populated if needed
      };
    });

    return NextResponse.json({
      totalUsers: totalUsers || 0,
      totalOrders: totalOrders || 0,
      totalRevenue,
      productCount: productCount || 0,
      recentOrders: transformedOrders,
    });
  } catch (error: any) {
    console.error('Error fetching summary:', error);
    return NextResponse.json(
      { message: 'Error fetching summary', error: error?.message },
      { status: 500 }
    );
  }
}


