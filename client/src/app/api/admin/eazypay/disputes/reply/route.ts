import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { replyDispute } from '@/lib/services/eazypayPortal';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/eazypay/disputes/reply
 * Reply to a dispute via EazyPay Portal (multipart/form-data)
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

    // Validate required fields
    if (!formFields.caseId || !formFields.msg) {
      return NextResponse.json(
        { message: 'Missing required fields: caseId, msg' },
        { status: 400 }
      );
    }

    // Add apiKey (will be handled by service)
    const apiKey = process.env.EAZYPAY_PORTAL_API_KEY;
    if (apiKey) {
      formFields.apiKey = apiKey;
    }

    const result = await replyDispute(formFields);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error replying to EazyPay dispute:', error);
    return NextResponse.json(
      {
        message: error.message || 'Failed to reply to dispute',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}

