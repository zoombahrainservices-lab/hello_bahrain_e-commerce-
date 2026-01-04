import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getTransactionDetails } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/transaction-details
 * Find transaction details by RRN and Auth Code
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { rrn, authCode, from, to } = body;

    if (!rrn || !authCode || !from || !to) {
      return NextResponse.json(
        { message: 'rrn, authCode, from, and to are required (dates in YYYY-MM-DD format)' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return NextResponse.json(
        { message: 'Date format must be YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const result = await getTransactionDetails({
      rrn,
      authCode,
      from,
      to,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching EazyPay transaction details:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to fetch transaction details',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

