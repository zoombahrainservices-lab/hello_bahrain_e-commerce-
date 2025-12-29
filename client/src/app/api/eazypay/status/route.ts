import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const merchantId = process.env.EAZYPAY_MERCHANT_ID || '';
const apiPassword = process.env.EAZYPAY_API_PASSWORD || '';
const baseUrl = process.env.EAZYPAY_API_BASE_URL || '';

function getAuthHeader() {
  const username = `merchant.${merchantId}`;
  const token = Buffer.from(`${username}:${apiPassword}`).toString('base64');
  return `Basic ${token}`;
}

// POST /api/eazypay/status - check payment status for an order
export async function POST(request: NextRequest) {
  try {
    if (!merchantId || !apiPassword || !baseUrl) {
      return NextResponse.json(
        { message: 'EazyPay environment variables are not configured' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json(
        { message: 'orderId is required' },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${baseUrl}/merchant/${encodeURIComponent(merchantId)}/order/${encodeURIComponent(
        String(orderId)
      )}`,
      {
        method: 'GET',
        headers: {
          Authorization: getAuthHeader(),
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error('EazyPay status error', response.status, text);
      return NextResponse.json(
        { message: 'Failed to fetch EazyPay status' },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('EazyPay status exception', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}


