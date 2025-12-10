import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { supabaseHelpers } from '@/lib/supabase-helpers';

export const dynamic = 'force-dynamic';

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { items, shippingAddress, paymentStatus } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { message: 'Order must contain at least one item' },
        { status: 400 }
      );
    }

    if (!shippingAddress) {
      return NextResponse.json(
        { message: 'Shipping address is required' },
        { status: 400 }
      );
    }

    // Verify products exist and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        return NextResponse.json(
          { message: `Product not found: ${item.productId}` },
          { status: 404 }
        );
      }

      if (!product.in_stock || product.stock_quantity < item.quantity) {
        return NextResponse.json(
          { message: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
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

    // Create order
    const { data: order, error: orderError } = await getSupabase()
      .from('orders')
      .insert({
        user_id: authResult.user.id,
        total,
        status: 'pending',
        payment_status: paymentStatus === 'paid' ? 'paid' : 'unpaid',
        shipping_address: shippingAddress,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create order items
    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: order.id,
    }));

    const { error: itemsError } = await getSupabase()
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (itemsError) throw itemsError;

    // Update stock quantities
    for (const item of orderItems) {
      const product = await supabaseHelpers.findProductById(item.product_id);
      if (product) {
        await getSupabase()
          .from('products')
          .update({ stock_quantity: product.stock_quantity - item.quantity })
          .eq('id', item.product_id);
      }
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

    return NextResponse.json(completeOrder, { status: 201 });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      { message: 'Error creating order' },
      { status: 500 }
    );
  }
}


