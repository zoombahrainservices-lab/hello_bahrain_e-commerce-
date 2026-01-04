import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSettlementReport } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/settlements
 * Get settlement report from EazyPay Portal
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { from, to } = body;

    if (!from || !to) {
      return NextResponse.json(
        { message: 'from and to dates are required (YYYY-MM-DD)' },
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

    const result = await getSettlementReport({ from, to });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching EazyPay settlements:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to fetch settlements',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

