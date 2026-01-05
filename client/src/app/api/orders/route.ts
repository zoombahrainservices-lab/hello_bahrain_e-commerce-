import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { supabaseHelpers } from '@/lib/supabase-helpers';
import { cors } from '@/lib/cors';
import { reserveStockBatch, releaseStockBatch } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

// Handle CORS preflight
export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    // Handle CORS preflight
    const corsResponse = cors.handlePreflight(request);
    if (corsResponse) return corsResponse;

    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return cors.addHeaders(authResult, request);
    }

    const body = await request.json();
    const { items, shippingAddress, paymentStatus, paymentMethod } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      const errorResponse = NextResponse.json(
        { message: 'Order must contain at least one item' },
        { status: 400 }
      );
      return cors.addHeaders(errorResponse, request);
    }

    if (!shippingAddress) {
      const errorResponse = NextResponse.json(
        { message: 'Shipping address is required' },
        { status: 400 }
      );
      return cors.addHeaders(errorResponse, request);
    }

    // Verify products exist and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        const errorResponse = NextResponse.json(
          { message: `Product not found: ${item.productId}` },
          { status: 404 }
        );
        return cors.addHeaders(errorResponse, request);
      }

      // Initial stock validation (final validation happens in atomic reservation)
      if (!product.in_stock || product.stock_quantity < item.quantity) {
        const errorResponse = NextResponse.json(
          { message: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
        return cors.addHeaders(errorResponse, request);
      }

      orderItems.push({
        product_id: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        image: product.image,
      });

      total += parseFloat(product.price.toString()) * item.quantity;
    }

    // Determine if order is paid (ONLY explicit paymentStatus === 'paid')
    // COD is unpaid until cash is collected
    const isPaid = paymentStatus === 'paid';
    
    // Reserve stock atomically BEFORE creating order
    // This ensures stock is reserved before order creation for both paid and unpaid orders
    const reserveResult = await reserveStockBatch(
      orderItems.map(item => ({
        productId: item.product_id,
        quantity: item.quantity,
      }))
    );

    if (!reserveResult.success) {
      const errorMessages = reserveResult.errors?.map(err => err.error).join(', ') || 'Failed to reserve stock';
      const errorResponse = NextResponse.json(
        { message: `Stock reservation failed: ${errorMessages}` },
        { status: 400 }
      );
      return cors.addHeaders(errorResponse, request);
    }

    // Calculate reservation expiry
    // COD should not expire in 15 minutes (customers expect delivery later)
    // Online payments expire in 15 minutes if unpaid
    const shouldExpireQuickly = !isPaid && paymentMethod !== 'cod';
    const reservationExpiresAt = shouldExpireQuickly
      ? new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 min for online
      : (!isPaid && paymentMethod === 'cod')
        ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours for COD
        : null;

    // Create order with inventory status
    const orderInsertData: any = {
      user_id: authResult.user.id,
      total,
      status: 'pending',
      payment_status: isPaid ? 'paid' : 'unpaid',
      payment_method: paymentMethod || null,
      shipping_address: shippingAddress,
      inventory_status: isPaid ? 'sold' : 'reserved',
      inventory_reserved_at: new Date().toISOString(),
    };

    if (reservationExpiresAt) {
      orderInsertData.reservation_expires_at = reservationExpiresAt;
    }

    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .insert(orderInsertData)
      .select()
      .single();

    if (orderError) {
      // If order creation failed after reserving stock, release the reserved stock
      await releaseStockBatch(
        orderItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
        }))
      );
      throw orderError;
    }

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await getSupabase()
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) {
      // If order items creation failed after reserving stock, release the reserved stock
      await releaseStockBatch(
        orderItems.map(item => ({
          productId: item.product_id,
          quantity: item.quantity,
        }))
      );
      throw itemsError;
    }

    // Fetch complete order with items
    const { data: completeOrder, error: fetchError } = await getSupabase()
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('id', order.id)
      .single();

    if (fetchError) throw fetchError;

    const response = NextResponse.json(completeOrder, { status: 201 });
    return cors.addHeaders(response, request);
  } catch (error) {
    console.error('Error creating order:', error);
    const errorResponse = NextResponse.json(
      { message: 'Error creating order' },
      { status: 500 }
    );
    return cors.addHeaders(errorResponse, request);
  }
}



