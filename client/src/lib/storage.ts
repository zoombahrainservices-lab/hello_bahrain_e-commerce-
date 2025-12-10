import { getSupabase } from './db';
import { randomUUID } from 'crypto';

// Upload a single base64 image (or URL) to Supabase Storage and return a public URL.
export async function uploadBase64Image(
  base64OrUrl: string,
  folder: 'products' | 'banners' | 'order-items',
): Promise<string> {
  if (!base64OrUrl || typeof base64OrUrl !== 'string') {
    throw new Error('Invalid image');
  }

  // If it's already a URL (not data:image), just return it
  if (!base64OrUrl.startsWith('data:image')) {
    return base64OrUrl;
  }

  const supabase = getSupabase();

  // Parse content type and data
  const [meta, data] = base64OrUrl.split(',');
  const match = meta.match(/data:(.*);base64/);
  const contentType = match?.[1] || 'image/png';

  const buffer = Buffer.from(data, 'base64');

  const fileExt = contentType.split('/')[1] || 'png';
  const fileName = `${folder}/${randomUUID()}.${fileExt}`;

  // Ensure bucket exists (idempotent)
  const bucketName = 'product-images';
  await supabase.storage.createBucket(bucketName, { public: true }).catch(() => {
    // ignore if already exists
  });

  const { error: uploadError } = await supabase.storage
    .from(bucketName)
    .upload(fileName, buffer, {
      contentType,
      upsert: true,
    });

  if (uploadError) {
    console.error('Error uploading image to Supabase storage:', uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage.from(bucketName).getPublicUrl(fileName);
  return publicUrlData.publicUrl;
}

// Upload multiple images and return an array of URLs
export async function uploadMultipleBase64Images(
  images: string[] | undefined | null,
  folder: 'products' | 'banners' | 'order-items',
): Promise<string[]> {
  if (!images || images.length === 0) return [];
  const result: string[] = [];
  for (const img of images) {
    // For each image, upload if it's base64, otherwise keep URL
    const url = await uploadBase64Image(img, folder);
    result.push(url);
  }
  return result;
}


