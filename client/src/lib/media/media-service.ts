import { randomUUID } from 'crypto';
import { getSupabase } from '@/lib/db';
import { uploadToR2 } from './r2';
import { buildStoragePath, storagePathToPublicUrl } from './urls';
import { computeSHA256 } from './hash';
import { processOriginalRaster, getImageMetadata } from './image-processing';
import { validateAndSanitizeSvg } from './svg';
import { persistRasterVariants, persistSvgPreviewVariant } from './variant-service';
import { validateUploadedFile, getExtensionFromMime, getFormatFromMime } from './validation';
import {
  MediaItem,
  MediaItemWithVariants,
  MediaItemWithVariantsAndUsageCount,
  MediaItemRow,
  MediaVariantRow,
  MediaFolderRow,
  MediaFolder,
  CreateMediaParams,
  ListMediaParams,
  UpdateMediaParams,
  MediaListResponse,
} from './types';

// ─── Row → App mappers ────────────────────────────────────────

function rowToMediaItem(row: MediaItemRow): MediaItem {
  return {
    id: row.id,
    folderId: row.folder_id,
    originalFileName: row.original_file_name,
    fileName: row.file_name,
    seoFileName: row.seo_file_name,
    mimeType: row.mime_type,
    extension: row.extension,
    format: row.format,
    fileSizeBytes: row.file_size_bytes,
    width: row.width,
    height: row.height,
    altText: row.alt_text,
    title: row.title,
    caption: row.caption,
    description: row.description,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    fileHash: row.file_hash,
    status: row.status,
    uploadedBy: row.uploaded_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function rowToVariant(row: MediaVariantRow) {
  return {
    id: row.id,
    mediaId: row.media_id,
    variant: row.variant,
    width: row.width,
    height: row.height,
    fileSizeBytes: row.file_size_bytes,
    mimeType: row.mime_type,
    extension: row.extension,
    format: row.format,
    storagePath: row.storage_path,
    publicUrl: row.public_url,
    createdAt: row.created_at,
  };
}

function rowToFolder(row: MediaFolderRow): MediaFolder {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    sortOrder: row.sort_order,
    isSystem: row.is_system,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── createMediaFromUpload ────────────────────────────────────

/**
 * The single entry point for persisting any file into the media library.
 *
 * Flow:
 * 1. Validate file type / extension / size
 * 2. Sanitize SVG if needed
 * 3. Compute SHA-256 hash
 * 4. Insert media_items row with status = 'processing'
 * 5. Upload original to R2
 * 6. Generate variants / SVG preview
 * 7. Upload variants to R2
 * 8. Insert media_variants rows
 * 9. Update media_items.status = 'active'
 * 10. Return full media item with variants
 */
export async function createMediaFromUpload(params: CreateMediaParams): Promise<MediaItemWithVariants> {
  const { originalFileName, mimeType, uploadedBy, folderId } = params;
  let { buffer } = params;

  const supabase = getSupabase();
  const isSvg = mimeType === 'image/svg+xml';

  // 1. Validate
  const validation = validateUploadedFile(originalFileName, mimeType, buffer.length);
  if (!validation.valid) throw new Error(validation.error);

  // 2. Sanitize SVG
  let sanitizedSvgString: string | undefined;
  if (isSvg) {
    const svgResult = validateAndSanitizeSvg(buffer);
    if (!svgResult.valid) throw new Error(svgResult.error ?? 'SVG validation failed.');
    sanitizedSvgString = svgResult.sanitized!;
    buffer = Buffer.from(sanitizedSvgString, 'utf-8');
  }

  // 3. Hash (on potentially cleaned buffer)
  const fileHash = computeSHA256(buffer);

  // Dedup: return the existing item if an active/legacy item with the same hash exists
  const { data: dup } = await supabase
    .from('media_items')
    .select('id')
    .eq('file_hash', fileHash)
    .or('status.eq.active,status.is.null')
    .maybeSingle();

  if (dup) {
    const existing = await getMediaById((dup as { id: string }).id);
    if (existing) return existing;
  }

  // 4. Optimize raster images before building storage paths
  const mediaId = randomUUID();
  const now = new Date();

  let storedMimeType = mimeType;
  let storedExtension = getExtensionFromMime(mimeType);
  let storedFormat = getFormatFromMime(mimeType);
  let originalBuffer = buffer;
  let width: number | null = null;
  let height: number | null = null;
  let processedSize = buffer.length;

  if (!isSvg) {
    const processed = await processOriginalRaster(buffer, mimeType);
    originalBuffer = processed.buffer;
    width = processed.width;
    height = processed.height;
    processedSize = processed.fileSizeBytes;
    storedMimeType = processed.mimeType;
    storedExtension = processed.extension;
    storedFormat = processed.format;
  }

  const safeFileName = `${mediaId}.${storedExtension}`;
  const originalStoragePath = buildStoragePath(mediaId, 'original', storedExtension, now);
  const originalPublicUrl = storagePathToPublicUrl(originalStoragePath);

  // 5. Insert media_items row — status: processing
  const insertPayload = {
    id: mediaId,
    folder_id: folderId ?? null,
    original_file_name: originalFileName,
    file_name: safeFileName,
    mime_type: storedMimeType,
    extension: storedExtension,
    format: storedFormat,
    file_size_bytes: processedSize,
    width,
    height,
    alt_text: params.altText ?? null,
    title: params.title ?? null,
    caption: params.caption ?? null,
    storage_disk: 'cloudflare_r2',
    storage_bucket: process.env.R2_BUCKET_NAME ?? 'cloudflare',
    storage_path: originalStoragePath,
    public_url: originalPublicUrl,
    file_hash: fileHash,
    status: 'processing' as const,
    uploaded_by: uploadedBy ?? null,
  };

  const { error: insertError } = await supabase.from('media_items').insert(insertPayload);
  if (insertError) throw new Error(`Failed to create media record: ${insertError.message}`);

  try {
    // 6. Upload optimized original
    await uploadToR2({
      storagePath: originalStoragePath,
      buffer: originalBuffer,
      contentType: storedMimeType,
    });

    // Insert original variant row
    await supabase.from('media_variants').insert({
      media_id: mediaId,
      variant: 'original',
      width,
      height,
      file_size_bytes: processedSize,
      mime_type: storedMimeType,
      extension: storedExtension,
      format: storedFormat,
      storage_path: originalStoragePath,
      public_url: originalPublicUrl,
    });

    // 7. Generate and upload variants
    const pathDate = now;
    const existingNames = new Set<string>(['original']);

    if (isSvg) {
      await persistSvgPreviewVariant(mediaId, buffer, existingNames, pathDate);
    } else {
      await persistRasterVariants(mediaId, originalBuffer, existingNames, pathDate);
    }

    // 9. Update status to active
    await supabase
      .from('media_items')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', mediaId);
  } catch (err: any) {
    // Update to failed on any processing error
    await supabase
      .from('media_items')
      .update({
        status: 'failed',
        error_message: err?.message ?? 'Unknown processing error',
        updated_at: new Date().toISOString(),
      })
      .eq('id', mediaId);
    throw err;
  }

  const full = await getMediaById(mediaId);
  if (!full) throw new Error('Media item not found after creation.');
  return full;
}

// ─── listMedia ────────────────────────────────────────────────

export async function listMedia(params: ListMediaParams): Promise<MediaListResponse> {
  const supabase = getSupabase();
  const { q, folderId, mimeType, sort = 'newest', page = 1, limit = 24 } = params;
  const offset = (page - 1) * limit;

  let query = supabase
    .from('media_items')
    .select('*', { count: 'exact' })
    // Include legacy rows where status is null, exclude only trashed ones.
    .or('status.is.null,status.neq.trashed');

  if (folderId) {
    query = query.eq('folder_id', folderId);
  }
  if (mimeType) {
    query = query.eq('mime_type', mimeType);
  }
  if (q) {
    query = query.textSearch(
      'search_vector',
      q,
      { type: 'plain', config: 'simple' },
    );
  }

  // Sorting
  switch (sort) {
    case 'oldest':         query = query.order('created_at', { ascending: true }); break;
    case 'file_size_asc':  query = query.order('file_size_bytes', { ascending: true }); break;
    case 'file_size_desc': query = query.order('file_size_bytes', { ascending: false }); break;
    case 'name_asc':       query = query.order('original_file_name', { ascending: true }); break;
    case 'name_desc':      query = query.order('original_file_name', { ascending: false }); break;
    default:               query = query.order('created_at', { ascending: false }); break;
  }

  query = query.range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error) throw new Error(`Failed to list media: ${error.message}`);

  const items = data as MediaItemRow[];
  const mediaIds = items.map((r) => r.id);

  // Fetch variants for these items
  let variantsByMediaId: Record<string, ReturnType<typeof rowToVariant>[]> = {};
  if (mediaIds.length > 0) {
    const { data: variantRows } = await supabase
      .from('media_variants')
      .select('*')
      .in('media_id', mediaIds);

    for (const vr of (variantRows ?? []) as MediaVariantRow[]) {
      if (!variantsByMediaId[vr.media_id]) variantsByMediaId[vr.media_id] = [];
      variantsByMediaId[vr.media_id].push(rowToVariant(vr));
    }
  }

  // Fetch usage counts — combine product_media (authoritative for products) and
  // media_usages (authoritative for banners / other entity types) to avoid drift.
  let usageCountByMediaId: Record<string, number> = {};
  if (mediaIds.length > 0) {
    // Product usages from the canonical product_media table
    const { data: productRows } = await supabase
      .from('product_media')
      .select('media_id')
      .in('media_id', mediaIds);

    for (const row of productRows ?? []) {
      usageCountByMediaId[row.media_id] = (usageCountByMediaId[row.media_id] ?? 0) + 1;
    }

    // Non-product usages (banners, future: news / events) from media_usages
    const { data: usageRows } = await supabase
      .from('media_usages')
      .select('media_id')
      .in('media_id', mediaIds)
      .neq('used_in_type', 'product');

    for (const ur of usageRows ?? []) {
      usageCountByMediaId[ur.media_id] = (usageCountByMediaId[ur.media_id] ?? 0) + 1;
    }
  }

  const enriched: MediaItemWithVariantsAndUsageCount[] = items.map((row) => ({
    ...rowToMediaItem(row),
    variants: variantsByMediaId[row.id] ?? [],
    usageCount: usageCountByMediaId[row.id] ?? 0,
  }));

  return { items: enriched, page, limit, total: count ?? 0 };
}

// ─── getMediaById ─────────────────────────────────────────────

export async function getMediaById(mediaId: string): Promise<MediaItemWithVariants | null> {
  const supabase = getSupabase();

  const { data: row, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('id', mediaId)
    .single();

  if (error || !row) return null;

  const { data: variantRows } = await supabase
    .from('media_variants')
    .select('*')
    .eq('media_id', mediaId);

  const { data: folderRow } = await supabase
    .from('media_folders')
    .select('*')
    .eq('id', (row as MediaItemRow).folder_id ?? '')
    .maybeSingle();

  return {
    ...rowToMediaItem(row as MediaItemRow),
    variants: (variantRows ?? []).map(rowToVariant),
    folder: folderRow ? rowToFolder(folderRow as MediaFolderRow) : null,
  };
}

// ─── updateMediaDetails ───────────────────────────────────────

export async function updateMediaDetails(mediaId: string, data: UpdateMediaParams): Promise<MediaItemWithVariants> {
  const supabase = getSupabase();

  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (data.folderId !== undefined)    updatePayload.folder_id = data.folderId;
  if (data.altText !== undefined)     updatePayload.alt_text = data.altText;
  if (data.title !== undefined)       updatePayload.title = data.title;
  if (data.caption !== undefined)     updatePayload.caption = data.caption;
  if (data.description !== undefined) updatePayload.description = data.description;
  if (data.seoFileName !== undefined) updatePayload.seo_file_name = data.seoFileName;

  const { error } = await supabase
    .from('media_items')
    .update(updatePayload)
    .eq('id', mediaId);

  if (error) throw new Error(`Failed to update media: ${error.message}`);

  const updated = await getMediaById(mediaId);
  if (!updated) throw new Error('Media item not found after update.');
  return updated;
}

// ─── getMediaUsages ───────────────────────────────────────────

export interface MediaUsageEntry {
  entityType: 'product' | 'banner' | string;
  entityId: string;
  entityName: string;
  entitySlug?: string;
  role: string;
  sortOrder: number;
}

/**
 * Returns all usages for a media item across all entity types.
 *
 * - Products: read from product_media (authoritative; does not rely on media_usages which can drift).
 * - Banners / other entities: read from media_usages.
 */
export async function getMediaUsages(mediaId: string): Promise<MediaUsageEntry[]> {
  const supabase = getSupabase();

  const results: MediaUsageEntry[] = [];

  // 1. Product usages from product_media
  const { data: productData } = await supabase
    .from('product_media')
    .select('role, sort_order, product_id, products(id, name, slug)')
    .eq('media_id', mediaId);

  for (const row of productData ?? []) {
    const product = Array.isArray((row as any).products) ? (row as any).products[0] : (row as any).products;
    results.push({
      entityType: 'product',
      entityId: product?.id ?? (row as any).product_id,
      entityName: product?.name ?? 'Unknown product',
      entitySlug: product?.slug ?? '',
      role: (row as any).role,
      sortOrder: (row as any).sort_order ?? 0,
    });
  }

  // 2. Banner / other usages from media_usages (exclude 'product' which is covered above)
  const { data: usageData } = await supabase
    .from('media_usages')
    .select('used_in_type, used_in_id, used_as')
    .eq('media_id', mediaId)
    .neq('used_in_type', 'product');

  for (const row of usageData ?? []) {
    const r = row as any;
    let entityName = `${r.used_in_type} ${r.used_in_id}`;

    // Resolve banner name if possible
    if (r.used_in_type === 'banner') {
      const { data: bannerRow } = await supabase
        .from('banners')
        .select('title')
        .eq('id', r.used_in_id)
        .maybeSingle();
      if (bannerRow) entityName = (bannerRow as any).title ?? entityName;
    }

    results.push({
      entityType: r.used_in_type,
      entityId: r.used_in_id,
      entityName,
      role: r.used_as ?? '',
      sortOrder: 0,
    });
  }

  return results;
}

// ─── safeDeleteMedia ──────────────────────────────────────────

export interface SafeDeleteResult {
  deleted: boolean;
  usageCount: number;
  usages?: { entityType: string; entityId: string; entityName: string; role: string }[];
}

export async function safeDeleteMedia(mediaId: string, adminUserId: string): Promise<SafeDeleteResult> {
  const supabase = getSupabase();

  const usages = await getMediaUsages(mediaId);
  const usageCount = usages.length;

  if (usageCount > 0) {
    return {
      deleted: false,
      usageCount,
      usages: usages.map((u) => ({
        entityType: u.entityType,
        entityId: u.entityId,
        entityName: u.entityName,
        role: u.role,
      })),
    };
  }

  const { error } = await supabase
    .from('media_items')
    .update({
      status: 'trashed',
      deleted_at: new Date().toISOString(),
      deleted_by: adminUserId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mediaId);

  if (error) throw new Error(`Failed to trash media: ${error.message}`);

  return { deleted: true, usageCount: 0 };
}

// ─── Trash helpers ────────────────────────────────────────────

export const TRASH_RETENTION_DAYS = 60;

export interface TrashedMediaItem extends MediaItemWithVariants {
  deletedAt: string;
  daysRemaining: number;
}

/** List all trashed items, auto-purge anything older than 60 days. */
export async function listTrashedMedia(): Promise<TrashedMediaItem[]> {
  const supabase = getSupabase();

  // Auto-purge items older than retention period
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - TRASH_RETENTION_DAYS);
  const { data: expired } = await supabase
    .from('media_items')
    .select('id, storage_path')
    .eq('status', 'trashed')
    .lt('deleted_at', cutoff.toISOString());

  if (expired && expired.length > 0) {
    const ids = (expired as MediaItemRow[]).map((r) => r.id);

    // Fetch variant paths so we delete every R2 object, not just the original
    const { data: expiredVariants } = await supabase
      .from('media_variants')
      .select('storage_path')
      .in('media_id', ids);

    const allPaths = [
      ...(expired as MediaItemRow[]).map((r) => r.storage_path),
      ...((expiredVariants ?? []) as { storage_path: string }[]).map((v) => v.storage_path),
    ];

    const { deleteFromR2 } = await import('./r2');
    for (const p of [...new Set(allPaths)]) {
      try { await deleteFromR2(p); } catch {}
    }

    await supabase.from('media_variants').delete().in('media_id', ids);
    await supabase.from('media_items').delete().in('id', ids);
  }

  // Fetch remaining trashed items
  const { data, error } = await supabase
    .from('media_items')
    .select('*')
    .eq('status', 'trashed')
    .order('deleted_at', { ascending: false });

  if (error) throw new Error(`Failed to list trash: ${error.message}`);

  const items = (data ?? []) as MediaItemRow[];
  const mediaIds = items.map((r) => r.id);

  let variantsByMediaId: Record<string, ReturnType<typeof rowToVariant>[]> = {};
  if (mediaIds.length > 0) {
    const { data: variantRows } = await supabase
      .from('media_variants').select('*').in('media_id', mediaIds);
    for (const vr of (variantRows ?? []) as MediaVariantRow[]) {
      if (!variantsByMediaId[vr.media_id]) variantsByMediaId[vr.media_id] = [];
      variantsByMediaId[vr.media_id].push(rowToVariant(vr));
    }
  }

  const now = Date.now();
  return items.map((row) => {
    const deletedAt = row.deleted_at ?? row.updated_at;
    const deletedMs = new Date(deletedAt).getTime();
    const daysUsed = Math.floor((now - deletedMs) / (1000 * 60 * 60 * 24));
    const daysRemaining = Math.max(0, TRASH_RETENTION_DAYS - daysUsed);
    return {
      ...rowToMediaItem(row),
      variants: variantsByMediaId[row.id] ?? [],
      deletedAt,
      daysRemaining,
    };
  });
}

/** Restore a trashed item back to active. */
export async function restoreMedia(mediaId: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('media_items')
    .update({
      status: 'active',
      deleted_at: null,
      deleted_by: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', mediaId)
    .eq('status', 'trashed');
  if (error) throw new Error(`Failed to restore media: ${error.message}`);
}

/** Permanently delete one item from DB and R2. Throws if still used by products. */
export async function permanentlyDeleteMedia(mediaId: string): Promise<void> {
  const supabase = getSupabase();

  const usages = await getMediaUsages(mediaId);
  if (usages.length > 0) {
    const names = usages.map((u) => `${u.entityName} (${u.entityType})`).join(', ');
    throw new Error(
      `Cannot permanently delete: image is still in use by ${usages.length} item(s): ${names}. Remove it from those first.`,
    );
  }

  const { data: row } = await supabase
    .from('media_items').select('storage_path').eq('id', mediaId).single();

  if (row) {
    const { deleteFromR2 } = await import('./r2');
    // Delete all R2 variants
    const { data: variants } = await supabase
      .from('media_variants').select('storage_path').eq('media_id', mediaId);
    const paths = [
      (row as MediaItemRow).storage_path,
      ...((variants ?? []) as { storage_path: string }[]).map((v) => v.storage_path),
    ];
    for (const p of [...new Set(paths)]) {
      try { await deleteFromR2(p); } catch {}
    }
  }

  await supabase.from('media_variants').delete().eq('media_id', mediaId);
  const { error } = await supabase.from('media_items').delete().eq('id', mediaId);
  if (error) throw new Error(`Failed to permanently delete media: ${error.message}`);
}

/** Permanently delete ALL trashed items. */
export async function emptyTrash(): Promise<number> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('media_items').select('id, storage_path').eq('status', 'trashed');

  if (!data || data.length === 0) return 0;

  const { deleteFromR2 } = await import('./r2');
  const items = data as MediaItemRow[];
  const ids = items.map((r) => r.id);

  const { data: variants } = await supabase
    .from('media_variants').select('storage_path').in('media_id', ids);

  const paths = [
    ...items.map((r) => r.storage_path),
    ...((variants ?? []) as { storage_path: string }[]).map((v) => v.storage_path),
  ];
  for (const p of [...new Set(paths)]) {
    try { await deleteFromR2(p); } catch {}
  }

  await supabase.from('media_variants').delete().in('media_id', ids);
  await supabase.from('media_items').delete().in('id', ids);

  return ids.length;
}

/** Count trashed items (for the sidebar badge). */
export async function countTrashedMedia(): Promise<number> {
  const supabase = getSupabase();
  const { count } = await supabase
    .from('media_items')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'trashed');
  return count ?? 0;
}

// ─── getMediaUsage ────────────────────────────────────────────

export async function getMediaUsage(mediaId: string) {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('media_usages')
    .select('*')
    .eq('media_id', mediaId);

  if (error) throw new Error(`Failed to get media usage: ${error.message}`);
  return data ?? [];
}

// ─── listFolders ──────────────────────────────────────────────

export async function listFolders() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('media_folders')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) throw new Error(`Failed to list folders: ${error.message}`);
  return (data ?? []).map(rowToFolder);
}

export async function getFolderBySlug(slug: string): Promise<MediaFolder | null> {
  const supabase = getSupabase();
  const { data } = await supabase
    .from('media_folders')
    .select('*')
    .eq('slug', slug)
    .maybeSingle();
  return data ? rowToFolder(data as MediaFolderRow) : null;
}
