import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { releaseStockBatch } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

// PATCH /api/admin/orders/:id/status - Update order status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { id } = params;
    const body = await request.json();
    const { status } = body;

    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Fetch order with order_items to check inventory status and get items for restoration
    const { data: existingOrder, error: fetchError } = await getSupabase()
      .from('orders')
      .select(`
        id,
        inventory_status,
        inventory_restored_at,
        order_items (
          product_id,
          quantity
        )
      `)
      .eq('id', id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { message: 'Order not found' },
          { status: 404 }
        );
      }
      throw fetchError;
    }

    // Prepare update data
    const updateData: any = { status };

    // Restore inventory if order is being cancelled
    if (status === 'cancelled') {
      const inventoryStatus = existingOrder.inventory_status;
      const inventoryRestoredAt = existingOrder.inventory_restored_at;

      // Only restore if:
      // 1. Inventory status is 'reserved' or 'sold' (not already released)
      // 2. Not already restored (idempotency check)
      if (
        (inventoryStatus === 'reserved' || inventoryStatus === 'sold') &&
        !inventoryRestoredAt
      ) {
        const orderItems = existingOrder.order_items || [];

        if (orderItems.length > 0) {
          // Restore stock for all order items
          const releaseResult = await releaseStockBatch(
            orderItems.map((item: any) => ({
              productId: item.product_id,
              quantity: item.quantity,
            }))
          );

          if (!releaseResult.success) {
            // Log error but continue with cancellation
            console.error('Failed to restore stock for cancelled order:', releaseResult.errors);
            // Still cancel the order even if stock restoration fails (can be corrected manually)
          }

          // Update inventory status and restoration timestamp (idempotency marker)
          updateData.inventory_status = 'released';
          updateData.inventory_restored_at = new Date().toISOString();
          
          // If it was reserved, also set released_at
          if (inventoryStatus === 'reserved') {
            updateData.inventory_released_at = new Date().toISOString();
          }
        }
      }
    }

    // Update order status (and inventory status if cancelled)
    const { data, error } = await getSupabase()
      .from('orders')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        users!orders_user_id_fkey(id, name, email),
        order_items (*)
      `)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error updating order status:', error);
    return NextResponse.json(
      { message: 'Error updating order status', error: error?.message },
      { status: 500 }
    );
  }
}


