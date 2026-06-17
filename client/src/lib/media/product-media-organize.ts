import { randomUUID } from 'crypto';
import { getSupabase } from '@/lib/db';
import { DEFAULT_FOLDER_SLUGS } from './constants';
import {
  buildMediaUrlIndex,
  extractStoragePathFromUrl,
  normalizeImageUrl,
  resolveMediaIdFromUrl,
} from './url-match';
import {
  setProductMediaOrder,
  syncProductImageColumns,
} from './product-media-service';

export interface OrganizeProductMediaResult {
  productsProcessed: number;
  productsLinked: number;
  mediaRegistered: number;
  mediaAlreadyInLibrary: number;
  foldersUpdated: number;
  usagesSynced: number;
  unmatched: { productId: string; productName: string; url: string }[];
  errors: string[];
}

function extFromUrl(url: string): string {
  const part = url.split('?')[0].split('.').pop()?.toLowerCase() ?? '';
  return part === 'jpg' ? 'jpg' : part;
}

function mimeFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    webp: 'image/webp',
    svg: 'image/svg+xml',
  };
  return map[ext] ?? 'image/jpeg';
}

function formatFromExt(ext: string): string {
  const map: Record<string, string> = {
    jpg: 'jpeg',
    jpeg: 'jpeg',
    png: 'png',
    webp: 'webp',
    svg: 'svg',
  };
  return map[ext] ?? 'jpeg';
}

function fileNameFromUrl(url: string): string {
  return url.split('?')[0].split('/').pop() ?? 'image';
}

async function registerMissingMediaItem(
  url: string,
  productsFolderId: string | null,
  productName: string,
): Promise<string | null> {
  const storagePath = extractStoragePathFromUrl(url);
  if (!storagePath) return null;

  const supabase = getSupabase();
  const ext = extFromUrl(url);
  const mimeType = mimeFromExt(ext);
  const format = formatFromExt(ext);
  const fileName = fileNameFromUrl(url);
  const mediaId = randomUUID();
  const now = new Date().toISOString();
  const normalizedUrl = normalizeImageUrl(url);

  const { error: itemErr } = await supabase.from('media_items').insert({
    id: mediaId,
    folder_id: productsFolderId,
    original_file_name: fileName,
    file_name: fileName,
    title: productName || null,
    mime_type: mimeType,
    extension: ext,
    format,
    file_size_bytes: 0,
    storage_disk: 'cloudflare_r2',
    storage_bucket: process.env.R2_BUCKET_NAME ?? 'helloonebahrain',
    storage_path: storagePath,
    public_url: normalizedUrl,
    status: 'active',
    created_at: now,
    updated_at: now,
  });

  if (itemErr) return null;

  await supabase.from('media_variants').insert({
    media_id: mediaId,
    variant: 'original',
    mime_type: mimeType,
    extension: ext,
    format,
    storage_path: storagePath,
    public_url: normalizedUrl,
    file_size_bytes: 0,
    created_at: now,
  });

  return mediaId;
}

/**
 * Link every product's images to media_items via product_media,
 * move matched files into the Products media folder, and sync usages.
 * Safe to run multiple times.
 */
export async function organizeAllProductMedia(): Promise<OrganizeProductMediaResult> {
  const supabase = getSupabase();
  const result: OrganizeProductMediaResult = {
    productsProcessed: 0,
    productsLinked: 0,
    mediaRegistered: 0,
    mediaAlreadyInLibrary: 0,
    foldersUpdated: 0,
    usagesSynced: 0,
    unmatched: [],
    errors: [],
  };

  const { data: folders } = await supabase
    .from('media_folders')
    .select('id, slug')
    .eq('slug', DEFAULT_FOLDER_SLUGS.products)
    .maybeSingle();

  const productsFolderId = folders?.id ?? null;

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, image, images');

  if (productsError) {
    result.errors.push(`Failed to load products: ${productsError.message}`);
    return result;
  }

  const { data: mediaItems, error: mediaError } = await supabase
    .from('media_items')
    .select('id, public_url, storage_path, folder_id, title')
    .eq('status', 'active');

  if (mediaError) {
    result.errors.push(`Failed to load media items: ${mediaError.message}`);
    return result;
  }

  let index = buildMediaUrlIndex(mediaItems ?? []);
  const mediaRows = [...(mediaItems ?? [])];
  const folderUpdatedIds = new Set<string>();

  for (const product of products ?? []) {
    result.productsProcessed++;

    const urlEntries: { url: string; role: 'main_image' | 'gallery_image' }[] = [];
    if (product.image) urlEntries.push({ url: product.image, role: 'main_image' });
    for (const img of product.images ?? []) {
      if (img && img !== product.image) {
        urlEntries.push({ url: img, role: 'gallery_image' });
      }
    }

    if (urlEntries.length === 0) continue;

    const orderedMediaIds: string[] = [];
    const seenMediaIds = new Set<string>();

    for (const entry of urlEntries) {
      let mediaId = resolveMediaIdFromUrl(entry.url, index);

      if (!mediaId) {
        const registeredId = await registerMissingMediaItem(
          entry.url,
          productsFolderId,
          product.name ?? '',
        );
        if (registeredId) {
          mediaId = registeredId;
          result.mediaRegistered++;
          const storagePath = extractStoragePathFromUrl(entry.url);
          const normalized = normalizeImageUrl(entry.url);
          mediaRows.push({
            id: registeredId,
            public_url: normalized,
            storage_path: storagePath,
            folder_id: productsFolderId,
            title: product.name ?? null,
          });
          index = buildMediaUrlIndex(mediaRows);
        } else {
          result.unmatched.push({
            productId: product.id,
            productName: product.name ?? '',
            url: entry.url,
          });
          continue;
        }
      } else {
        result.mediaAlreadyInLibrary++;
      }

      if (seenMediaIds.has(mediaId)) continue;
      seenMediaIds.add(mediaId);
      orderedMediaIds.push(mediaId);

      const mediaRow = mediaRows.find((m) => m.id === mediaId);
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (
        productsFolderId &&
        mediaRow?.folder_id !== productsFolderId &&
        !folderUpdatedIds.has(mediaId)
      ) {
        updates.folder_id = productsFolderId;
        folderUpdatedIds.add(mediaId);
        result.foldersUpdated++;
      }

      if (product.name && (!mediaRow?.title || mediaRow.title === fileNameFromUrl(entry.url))) {
        updates.title = product.name;
      }

      if (Object.keys(updates).length > 1) {
        await supabase.from('media_items').update(updates).eq('id', mediaId);
        if (mediaRow) {
          if (updates.folder_id) mediaRow.folder_id = productsFolderId;
          if (updates.title) mediaRow.title = product.name ?? null;
        }
      }

      await supabase.from('media_usages').upsert(
        {
          media_id: mediaId,
          used_in_type: 'product',
          used_in_id: product.id,
          used_as: entry.role,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'media_id,used_in_type,used_in_id,used_as' },
      );
      result.usagesSynced++;
    }

    if (orderedMediaIds.length === 0) continue;

    try {
      await setProductMediaOrder(product.id, orderedMediaIds);
      await syncProductImageColumns(product.id);
      result.productsLinked++;
    } catch (err: any) {
      result.errors.push(`Product ${product.id}: ${err?.message ?? 'Failed to link media'}`);
    }
  }

  return result;
}
