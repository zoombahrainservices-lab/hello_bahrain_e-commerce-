import { Router, Response, Request } from 'express';
import { authMiddleware } from '../middleware/auth';
import { getSupabase } from '../config/db';
import { supabaseHelpers } from '../lib/supabase';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// POST /api/orders - Create new order
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { items, shippingAddress, paymentStatus } = req.body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ message: 'Order must contain at least one item' });
      return;
    }

    if (!shippingAddress) {
      res.status(400).json({ message: 'Shipping address is required' });
      return;
    }

    // Verify products exist and calculate total
    let total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = await supabaseHelpers.findProductById(item.productId);
      
      if (!product) {
        res.status(404).json({ message: `Product not found: ${item.productId}` });
        return;
      }

      if (!product.in_stock || product.stock_quantity < item.quantity) {
        res.status(400).json({ message: `Insufficient stock for ${product.name}` });
        return;
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
        user_id: req.user.id,
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

    res.status(201).json(completeOrder);
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: 'Error creating order' });
  }
});

// GET /api/orders/my - Get user's orders
router.get('/my', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Authentication required' });
      return;
    }

    const { data, error } = await getSupabase()
      .from('orders')
      .select(`
        *,
        order_items (*)
      `)
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) throw error;

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
      shippingAddress: order.shipping_address,
      createdAt: order.created_at,
      updatedAt: order.updated_at,
    }));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'Error fetching orders' });
  }
});

export default router;
