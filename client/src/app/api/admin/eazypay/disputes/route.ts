import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { disputeList } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/disputes
 * Get disputes list from EazyPay Portal
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json().catch(() => ({}));
    const { page = '1', size = '20', caseId, dateFlag, dateFrom, dateTo } = body;

    // Validate size
    const sizeNum = parseInt(size);
    if (isNaN(sizeNum) || sizeNum < 1 || sizeNum > 50) {
      return NextResponse.json(
        { message: 'Size must be between 1 and 50' },
        { status: 400 }
      );
    }

    // Validate dateFlag requirements
    if (dateFlag && (!dateFrom || !dateTo)) {
      return NextResponse.json(
        { message: 'dateFrom and dateTo are required when dateFlag is set' },
        { status: 400 }
      );
    }

    const result = await disputeList({
      page: String(page),
      size: String(size),
      caseId,
      dateFlag: dateFlag || null,
      dateFrom,
      dateTo,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching EazyPay disputes:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to fetch disputes',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

