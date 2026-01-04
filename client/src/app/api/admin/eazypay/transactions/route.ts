import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getLiveTransactions } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/transactions
 * Get live transactions from EazyPay Portal
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json().catch(() => ({}));
    const { page = '1', size = '20', id, terminalId, cardNo, terminalName } = body;

    // Validate size
    const sizeNum = parseInt(size);
    if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 50) {
      return NextResponse.json(
        { message: 'Size must be between 1 and 50' },
        { status: 400 }
      );
    }

    const result = await getLiveTransactions({
      page: String(page),
      size: String(size),
      id,
      terminalId,
      cardNo,
      terminalName,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching EazyPay transactions:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to fetch transactions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

