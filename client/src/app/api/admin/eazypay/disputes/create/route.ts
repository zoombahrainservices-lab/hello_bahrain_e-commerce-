import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createDispute } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/disputes/create
 * Create a new dispute via EazyPay Portal (multipart/form-data)
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = requireAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Parse multipart/form-data
    const formData = await request.formData();

    // Convert FormData to object for service
    const formFields: Record<string, string | File> = {};
    for (const [key, value] of formData.entries()) {
      formFields[key] = value as string | File;
    }

    // Validate required fields (apiKey is added by service)
    const requiredFields = [
      'submitterName',
      'terminalId',
      'cardNo',
      'transactionDate',
      'transactionAmount',
      'claimAmount',
      'msg',
    ];

    for (const field of requiredFields) {
      if (!formFields[field]) {
        return NextResponse.json(
          { message: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    // Add apiKey (will be handled by service, but we can add it here too)
    const apiKey = process.env.EAZYPAY_PORTAL_API_KEY;
    if (apiKey) {
      formFields.apiKey = apiKey;
    }

    const result = await createDispute(formFields);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error creating EazyPay dispute:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to create dispute',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

