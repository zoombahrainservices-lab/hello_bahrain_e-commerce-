import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { storagePathToPublicUrl } from './urls';

// Server-only — never imported on the client side.

function createR2Client(): S3Client {
  return new S3Client({
    region: 'auto',
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

function getBucket(): string {
  return process.env.R2_BUCKET_NAME!;
}

export interface UploadToR2Params {
  storagePath: string;
  buffer: Buffer;
  contentType: string;
}

export async function uploadToR2({ storagePath, buffer, contentType }: UploadToR2Params): Promise<void> {
  const client = createR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: storagePath,
      Body: buffer,
      ContentType: contentType,
    }),
  );
}

export async function deleteFromR2(storagePath: string): Promise<void> {
  const client = createR2Client();
  await client.send(
    new DeleteObjectCommand({
      Bucket: getBucket(),
      Key: storagePath,
    }),
  );
}

/**
 * Stream an object from R2 and return its body as a Buffer.
 * Used by the download proxy endpoint.
 */
export async function downloadFromR2(storagePath: string): Promise<{ buffer: Buffer; contentType: string }> {
  const client = createR2Client();
  const result = await client.send(
    new GetObjectCommand({
      Bucket: getBucket(),
      Key: storagePath,
    }),
  );

  const chunks: Uint8Array[] = [];
  const stream = result.Body as AsyncIterable<Uint8Array>;
  for await (const chunk of stream) {
    chunks.push(chunk);
  }

  return {
    buffer: Buffer.concat(chunks),
    contentType: result.ContentType ?? 'application/octet-stream',
  };
}

export { storagePathToPublicUrl as getPublicUrl };
