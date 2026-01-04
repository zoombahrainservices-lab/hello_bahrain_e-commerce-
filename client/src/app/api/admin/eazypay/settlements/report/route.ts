import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { viewMerchantSettlementsReport } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/settlements/report
 * Get merchant settlement report (PDF/CSV download link)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const body = await request.json();
    const { from, to, storePublicId, reportFileType = 'pdf' } = body;

    if (!from || !to || !storePublicId) {
      return NextResponse.json(
        {
          message: 'from, to, and storePublicId are required. reportFileType can be "pdf" or "csv"',
        },
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

    if (reportFileType !== 'pdf' && reportFileType !== 'csv') {
      return NextResponse.json(
        { message: 'reportFileType must be "pdf" or "csv"' },
        { status: 400 }
      );
    }

    const result = await viewMerchantSettlementsReport({
      from,
      to,
      storePublicId,
      reportFileType,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error fetching EazyPay settlement report:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to fetch settlement report',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

