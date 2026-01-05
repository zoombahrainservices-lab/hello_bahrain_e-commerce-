import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/orders/my - Get user's orders
export async function GET(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    console.log('[Orders API] Fetching orders for user:', authResult.user.id);
    console.log('[Orders API] Using Supabase URL:', process.env.SUPABASE_URL?.substring(0, 30) + '...');

    // First, fetch all orders for the user (without order_items to ensure we get all orders)
    const { data: ordersData, error: ordersError } = await getSupabase()
      .from('orders')
      .select('*')
      .eq('user_id', authResult.user.id)
      .order('created_at', { ascending: false });

    if (ordersError) {
      console.error('[Orders API] Error fetching orders:', ordersError);
      throw ordersError;
    }

    console.log('[Orders API] Found', ordersData?.length || 0, 'orders for user');

    // Enhanced debug logging - before fetching items
    if (process.env.NODE_ENV === 'development') {
      console.log('[Orders API] Fetched orders (before items):', {
        count: ordersData?.length || 0,
        userId: authResult.user.id,
        orderIds: ordersData?.map((o: any) => o.id),
        statuses: ordersData?.map((o: any) => `${o.id.slice(-5)}: ${o.status}/${o.payment_status}`),
        paymentMethods: ordersData?.map((o: any) => `${o.id.slice(-5)}: ${o.payment_method}`),
        inventoryStatuses: ordersData?.map((o: any) => `${o.id.slice(-5)}: ${o.inventory_status}`),
        latestOrderDate: ordersData?.[0]?.created_at,
      });
    }

    // Now fetch order_items for all orders
    const orderIds = (ordersData || []).map((o: any) => o.id);
    let orderItemsMap: Record<string, any[]> = {};

    if (orderIds.length > 0) {
      const { data: itemsData, error: itemsError } = await getSupabase()
        .from('order_items')
        .select('*')
        .in('order_id', orderIds);

      if (itemsError) {
        console.error('[Orders API] Error fetching order_items:', itemsError);
        // Don't throw - continue with empty items
      } else {
        // Group items by order_id
        (itemsData || []).forEach((item: any) => {
          if (!orderItemsMap[item.order_id]) {
            orderItemsMap[item.order_id] = [];
          }
          orderItemsMap[item.order_id].push(item);
        });
      }
    }

    // Combine orders with their items
    const data = (ordersData || []).map((order: any) => ({
      ...order,
      order_items: orderItemsMap[order.id] || [],
    }));

    // Debug logging - after combining
    if (process.env.NODE_ENV === 'development') {
      console.log('[Orders API] Final orders with items:', {
        count: data?.length || 0,
        ordersWithItems: data.filter((o: any) => (o.order_items || []).length > 0).length,
        ordersWithoutItems: data.filter((o: any) => (o.order_items || []).length === 0).length,
        orderIds: data?.map((o: any) => o.id),
      });
    }

    // Transform data to match expected format
    const orders = (data || []).map((order: any) => ({
      _id: order.id,
      user: order.users || order.user_id,
      items: (order.order_items || []).map((item: any) => ({
        product: item.product_id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: order.total,
      status: order.status,
      paymentStatus: order.payment_status,
      paymentMethod: order.payment_method,
      shippingAddress: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    const response = NextResponse.json(orders);
    // Add cache control headers to prevent browser/CDN caching
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { message: 'Error fetching orders' },
      { status: 500 }
    );
  }
}


