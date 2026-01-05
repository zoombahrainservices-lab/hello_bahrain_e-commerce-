import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { cors } from '@/lib/cors';
import { reserveStockBatch, releaseStockBatch } from '@/lib/db-stock-helpers';

export const dynamic = 'force-dynamic';

export async function OPTIONS(request: NextRequest) {
  return cors.handlePreflight(request) || new NextResponse(null, { status: 204 });
}

/**
 * POST /api/checkout-sessions
 * Creates a checkout session for online payment (Benefit Pay or EazyPay)
 * Reserves inventory and stores cart snapshot
 * 
 * Request body:
 * - items: Array<{productId, quantity, name, price, image}>
 * - shippingAddress: ShippingFormData
 * - total: number
 * - paymentMethod: 'benefitpay_wallet' | 'card' | 'cod'
 * 
 * Response:
 * - sessionId: string
 * - expiresAt: string (ISO timestamp)
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
    const { items, shippingAddress, total, paymentMethod } = body;

    // Validation
    if (!items || !Array.isArray(items) || items.length === 0) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Items are required' }, { status: 400 }),
        request
      );
    }

    if (!shippingAddress) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Shipping address is required' }, { status: 400 }),
        request
      );
    }

    if (!total || parseFloat(total) <= 0) {
      return cors.addHeaders(
        NextResponse.json({ message: 'Valid total amount is required' }, { status: 400 }),
        request
      );
    }

    if (paymentMethod !== 'benefitpay_wallet' && paymentMethod !== 'card' && paymentMethod !== 'cod') {
      return cors.addHeaders(
        NextResponse.json({ message: 'Payment method must be benefitpay_wallet, card, or cod' }, { status: 400 }),
        request
      );
    }

    // Reserve stock atomically BEFORE creating session
    const reserveResult = await reserveStockBatch(
      items.map((item: any) => ({
        productId: item.productId,
        quantity: item.quantity,
      }))
    );

    if (!reserveResult.success) {
      const errorMessages = reserveResult.errors?.map(err => err.error).join(', ') || 'Failed to reserve stock';
      return cors.addHeaders(
        NextResponse.json({ message: `Stock reservation failed: ${errorMessages}` }, { status: 400 }),
        request
      );
    }

    // Create checkout session
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

    const { data: session, error: sessionError } = await getSupabase()
      .from('checkout_sessions')
      .insert({
        user_id: authResult.user.id,
        items: items,
        shipping_address: shippingAddress,
        total: parseFloat(total.toString()),
        payment_method: paymentMethod,
        status: 'initiated',
        inventory_reserved_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (sessionError) {
      // If session creation fails, release reserved stock
      await releaseStockBatch(
        items.map((item: any) => ({
          productId: item.productId,
          quantity: item.quantity,
        }))
      ).catch(releaseError => {
        console.error('[Checkout Session] Failed to release stock after session creation failure:', releaseError);
      });

      throw sessionError;
    }

    console.log('[Checkout Session] Created session:', session.id, 'for user:', authResult.user.id);

    return cors.addHeaders(
      NextResponse.json({
        sessionId: session.id,
        expiresAt: session.expires_at,
      }),
      request
    );
  } catch (error: any) {
    console.error('[Checkout Session] Error:', error);
    return cors.addHeaders(
      NextResponse.json(
        { message: error.message || 'Failed to create checkout session' },
        { status: 500 }
      ),
      request
    );
  }
}

