import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { createMediaFromUpload } from '@/lib/media/media-service';
import { uploadMetadataSchema } from '@/lib/media/validation';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// POST /api/admin/media/upload
// Accepts multipart/form-data with:
//   files[]      - one or more files (MVP: first file only processed)
//   folderId     - optional UUID
//   altText      - optional
//   title        - optional
//   caption      - optional
export async function POST(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;
  const { user } = authResult;

  try {
    const formData = await request.formData();

    // Support both "file" and "files[]" field names
    const fileEntry = formData.get('file') ?? formData.get('files[]');
    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json({ message: 'No file provided.' }, { status: 400 });
    }

    const file = fileEntry as File;

    // Validate metadata fields
    const metaParsed = uploadMetadataSchema.safeParse({
      folderId: formData.get('folderId') ?? undefined,
      altText:  formData.get('altText')  ?? undefined,
      title:    formData.get('title')    ?? undefined,
      caption:  formData.get('caption')  ?? undefined,
    });

    if (!metaParsed.success) {
      return NextResponse.json(
        { message: 'Invalid metadata', errors: metaParsed.error.flatten() },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const media = await createMediaFromUpload({
      buffer,
      originalFileName: file.name,
      mimeType: file.type,
      folderId: metaParsed.data.folderId ?? null,
      altText: metaParsed.data.altText,
      title: metaParsed.data.title,
      caption: metaParsed.data.caption,
      uploadedBy: user.id,
    });

    return NextResponse.json(media, { status: 201 });
  } catch (err: any) {
    console.error('POST /api/admin/media/upload error:', err);
    return NextResponse.json(
      { message: err?.message ?? 'Upload failed.' },
      { status: 500 },
    );
  }
}
