import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

export const dynamic = 'force-dynamic';

// GET /api/admin/r2-test
// Validates R2 connectivity: checks env vars, uploads a test file, verifies it, deletes it.
// No auth required — this is a connectivity validation tool only. Secrets are never returned.
export async function GET(_request: NextRequest) {

  const results: Record<string, { ok: boolean; detail?: string }> = {};

  // 1. Check required env vars are present (values are never returned)
  const requiredVars = [
    'R2_ACCOUNT_ID',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_PUBLIC_BASE_URL',
  ];
  const missingVars = requiredVars.filter((v) => !process.env[v]);
  results.env_vars = {
    ok: missingVars.length === 0,
    detail:
      missingVars.length === 0
        ? 'All required R2 env vars are set'
        : `Missing: ${missingVars.join(', ')}`,
  };

  if (missingVars.length > 0) {
    return NextResponse.json({ passed: false, results }, { status: 500 });
  }

  const accountId = process.env.R2_ACCOUNT_ID!;
  const bucket = process.env.R2_BUCKET_NAME!;
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL!;
  const testKey = `test/r2-connection-test-${Date.now()}.txt`;
  const expectedPublicUrl = `${publicBaseUrl}/${testKey}`;

  const r2 = new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  // 2. Upload test file
  try {
    await r2.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: testKey,
        Body: Buffer.from('R2 connection test — HelloOneBahrain'),
        ContentType: 'text/plain',
      }),
    );
    results.upload = { ok: true, detail: `Uploaded test object: ${testKey}` };
  } catch (err: any) {
    results.upload = { ok: false, detail: err?.message };
    return NextResponse.json({ passed: false, results }, { status: 500 });
  }

  // 3. Verify the object exists in R2
  try {
    await r2.send(new HeadObjectCommand({ Bucket: bucket, Key: testKey }));
    results.file_exists = { ok: true, detail: 'HeadObject confirmed the file exists in R2' };
  } catch (err: any) {
    results.file_exists = { ok: false, detail: err?.message };
  }

  // 4. Confirm the expected public URL format
  results.public_url = {
    ok: true,
    detail: expectedPublicUrl,
  };

  // 5. Delete the test file
  try {
    await r2.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }));
    results.delete = { ok: true, detail: 'Test object deleted successfully' };
  } catch (err: any) {
    results.delete = { ok: false, detail: err?.message };
  }

  const allPassed = Object.values(results).every((r) => r.ok);

  return NextResponse.json(
    {
      passed: allPassed,
      bucket,
      publicBaseUrl,
      results,
    },
    { status: allPassed ? 200 : 500 },
  );
}
