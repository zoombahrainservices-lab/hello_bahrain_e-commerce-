import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { data: order, error: fetchError } = await getSupabase()
      .from('orders')
      .select('id, payment_method, payment_status')
      .eq('id', params.id)
      .single();

    if (fetchError || !order) {
      return NextResponse.json({ message: 'Order not found' }, { status: 404 });
    }

    if (order.payment_method !== 'cod') {
      return NextResponse.json(
        { message: 'Only COD orders can be marked as paid via this endpoint' },
        { status: 400 }
      );
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json(
        { message: 'Order is already marked as paid' },
        { status: 400 }
      );
    }

    const { error: updateError } = await getSupabase()
      .from('orders')
      .update({
        payment_status: 'paid',
        paid_on: new Date().toISOString(),
        inventory_status: 'sold',
      })
      .eq('id', params.id)
      .eq('payment_method', 'cod')
      .eq('payment_status', 'unpaid'); // Idempotent: only update if still unpaid

    if (updateError) throw updateError;

    return NextResponse.json({ 
      success: true, 
      message: 'COD order marked as paid' 
    });
  } catch (error: any) {
    console.error('[Admin] Error marking COD as paid:', error);
    return NextResponse.json(
      { message: error.message || 'Error updating order' },
      { status: 500 }
    );
  }
}


