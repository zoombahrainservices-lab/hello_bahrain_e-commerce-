import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const merchantId = process.env.EAZYPAY_MERCHANT_ID || '';
const apiPassword = process.env.EAZYPAY_API_PASSWORD || '';
const baseUrl = process.env.EAZYPAY_API_BASE_URL || '';
const returnUrl = process.env.EAZYPAY_RETURN_URL || '';
const cancelUrl = process.env.EAZYPAY_CANCEL_URL || '';

function getAuthHeader() {
  const username = `merchant.${merchantId}`;
  const token = Buffer.from(`${username}:${apiPassword}`).toString('base64');
  return `Basic ${token}`;
}

// POST /api/eazypay/session - create EazyPay/MPGS session
export async function POST(request: NextRequest) {
  try {
    if (!merchantId || !apiPassword || !baseUrl) {
      return NextResponse.json(
        { message: 'EazyPay environment variables are not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { amount, currency = 'BHD', orderId } = body;

    if (!amount || !orderId) {
      return NextResponse.json(
        { message: 'amount and orderId are required' },
        { status: 400 }
      );
    }

    const payload = {
      apiOperation: 'INITIATE_CHECKOUT',
      order: {
        id: String(orderId),
        amount: Number(amount).toFixed(3),
        currency,
        description: `Order #${orderId}`,
      },
      interaction: {
        operation: 'PURCHASE',
        returnUrl,
        cancelUrl,
      },
    };

    const response = await fetch(
      `${baseUrl}/merchant/${encodeURIComponent(merchantId)}/session`,
      {
        method: 'POST',
        headers: {
          Authorization: getAuthHeader(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('EazyPay session error', response.status, text);
      return NextResponse.json(
        { message: 'Failed to create EazyPay session' },
        { status: 500 }
      );
    }

    const data: any = await response.json();
    const sessionId = data?.session?.id;

    if (!sessionId) {
      console.error('EazyPay response missing session.id', data);
      return NextResponse.json(
        { message: 'Invalid EazyPay response' },
        { status: 500 }
      );
    }

    return NextResponse.json({ sessionId, orderId });
  } catch (error) {
    console.error('EazyPay session exception', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


