import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-middleware';
import { getSupabase } from '@/lib/db';
import { randomUUID } from 'crypto';
import { backfillMediaVariants } from '@/lib/media/variant-service';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// Image processing takes time — allow up to 60 s
export const maxDuration = 60;

const R2_BASE = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';

function extFromUrl(url: string): string {
  const path = url.split('?')[0];
  const part = path.split('.').pop()?.toLowerCase() ?? '';
  return part;
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

function normalizedExt(ext: string): string {
  return ext === 'jpg' ? 'jpg' : ext;
}

function storagePathFromUrl(url: string): string | null {
  if (!R2_BASE || !url.startsWith(R2_BASE)) return null;
  return url.slice(R2_BASE.length + 1); // strip leading /
}

function fileNameFromUrl(url: string): string {
  return url.split('?')[0].split('/').pop() ?? 'image';
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  details: { url: string; mediaId: string; action: 'created' | 'already_exists' }[];
}

/**
 * GET /api/admin/import-existing-images
 *
 * One-time idempotent migration: reads all products and banners,
 * finds R2 image URLs, and registers each one in media_items so
 * they show up in the media library. Also creates media_usages and
 * product_media rows. Products/banners tables are NOT modified.
 *
 * Safe to run multiple times — duplicate URLs are skipped.
 */
export async function GET(request: NextRequest) {
  const authResult = requireAdmin(request);
  if (authResult instanceof NextResponse) return authResult;

  const supabase = getSupabase();
  const result: ImportResult = { imported: 0, skipped: 0, errors: [], details: [] };

  // ── 0. Load folder IDs ──────────────────────────────────────────
  const { data: folders } = await supabase.from('media_folders').select('id, slug');
  const folderBySlug: Record<string, string> = {};
  for (const f of folders ?? []) folderBySlug[f.slug] = f.id;

  // ── 1. Collect all (url, source) pairs ─────────────────────────
  const { data: products } = await supabase.from('products').select('id, name, image, images');
  const { data: banners } = await supabase.from('banners').select('id, title, image');

  interface UrlEntry {
    url: string;
    entityType: 'product' | 'banner';
    entityId: string;
    role: string; // 'main_image' | 'gallery_image' | 'banner_image'
    sortOrder: number;
    folderSlug: string;
    title: string;
  }

  const entries: UrlEntry[] = [];

  for (const p of products ?? []) {
    if (p.image && typeof p.image === 'string') {
      entries.push({
        url: p.image,
        entityType: 'product',
        entityId: p.id,
        role: 'main_image',
        sortOrder: 0,
        folderSlug: 'products',
        title: p.name ?? '',
      });
    }
    for (let i = 0; i < (p.images?.length ?? 0); i++) {
      const img = p.images[i];
      if (img && typeof img === 'string') {
        entries.push({
          url: img,
          entityType: 'product',
          entityId: p.id,
          role: 'gallery_image',
          sortOrder: i + 1,
          folderSlug: 'products',
          title: p.name ?? '',
        });
      }
    }
  }

  for (const b of banners ?? []) {
    if (b.image && typeof b.image === 'string') {
      entries.push({
        url: b.image,
        entityType: 'banner',
        entityId: b.id,
        role: 'banner_image',
        sortOrder: 0,
        folderSlug: 'banners',
        title: b.title ?? '',
      });
    }
  }

  // ── 2. Build a map: public_url → existing media_item id ────────
  const allUrls = entries.map((e) => e.url).filter((u) => storagePathFromUrl(u) !== null);
  const uniqueUrls = [...new Set(allUrls)];

  const { data: existingItems } = await supabase
    .from('media_items')
    .select('id, public_url')
    .in('public_url', uniqueUrls);

  const existingByUrl: Record<string, string> = {};
  for (const item of existingItems ?? []) {
    existingByUrl[item.public_url] = item.id;
  }

  // ── 3. Insert missing media_items one by one ───────────────────
  const urlToMediaId: Record<string, string> = { ...existingByUrl };

  for (const url of uniqueUrls) {
    if (existingByUrl[url]) {
      result.skipped++;
      result.details.push({ url, mediaId: existingByUrl[url], action: 'already_exists' });
      continue;
    }

    const storagePath = storagePathFromUrl(url);
    if (!storagePath) continue; // external URL — skip silently

    const ext = extFromUrl(url);
    const mimeType = mimeFromExt(ext);
    const format = formatFromExt(ext);
    const cleanExt = normalizedExt(ext);
    const fileName = fileNameFromUrl(url);
    const mediaId = randomUUID();
    const now = new Date().toISOString();

    // Determine folder from URL path segment
    const folderSlug = url.includes('/products/') ? 'products'
      : url.includes('/banners/') ? 'banners'
      : url.includes('/news/') ? 'news'
      : url.includes('/categories/') ? 'categories'
      : url.includes('/logos/') ? 'logos'
      : url.includes('/posters/') ? 'posters'
      : url.includes('/events/') ? 'events'
      : url.includes('/directory/') ? 'directory'
      : 'general';

    const folderId = folderBySlug[folderSlug] ?? folderBySlug['general'] ?? null;

    try {
      // Insert media_item
      const { error: itemErr } = await supabase.from('media_items').insert({
        id: mediaId,
        folder_id: folderId,
        original_file_name: fileName,
        file_name: fileName,
        mime_type: mimeType,
        extension: cleanExt,
        format,
        file_size_bytes: 0,
        storage_disk: 'cloudflare_r2',
        storage_bucket: process.env.R2_BUCKET_NAME ?? 'helloonebahrain',
        storage_path: storagePath,
        public_url: url,
        status: 'active',
        created_at: now,
        updated_at: now,
      });

      if (itemErr) {
        result.errors.push(`media_item insert failed for ${url}: ${itemErr.message}`);
        continue;
      }

      // Insert original variant
      await supabase.from('media_variants').insert({
        media_id: mediaId,
        variant: 'original',
        mime_type: mimeType,
        extension: cleanExt,
        format,
        storage_path: storagePath,
        public_url: url,
        file_size_bytes: 0,
        created_at: now,
      });

      urlToMediaId[url] = mediaId;
      result.imported++;
      result.details.push({ url, mediaId, action: 'created' });
    } catch (err: any) {
      result.errors.push(`Exception for ${url}: ${err?.message}`);
    }
  }

  // ── 4. Upsert media_usages + product_media ─────────────────────
  for (const entry of entries) {
    const mediaId = urlToMediaId[entry.url];
    if (!mediaId) continue; // external or errored — skip

    // media_usages
    await supabase.from('media_usages').upsert(
      {
        media_id: mediaId,
        used_in_type: entry.entityType,
        used_in_id: entry.entityId,
        used_as: entry.role,
      },
      { onConflict: 'media_id,used_in_type,used_in_id,used_as', ignoreDuplicates: true },
    );

    // product_media (products only)
    if (entry.entityType === 'product') {
      const productRole = entry.role === 'main_image' ? 'main_image' : 'gallery_image';
      await supabase.from('product_media').upsert(
        {
          product_id: entry.entityId,
          media_id: mediaId,
          role: productRole,
          sort_order: entry.sortOrder,
        },
        { onConflict: 'product_id,media_id,role', ignoreDuplicates: true },
      );
    }
  }

  // Auto-backfill: generate missing WebP variants for newly imported items.
  // Run non-blocking — if it fails, the import result is still returned.
  let backfillReport: { processed: number; succeeded: number; failed: number; totalGenerated: number } | null = null;
  const newlyImportedIds = result.details
    .filter((d) => d.action === 'created')
    .map((d) => d.mediaId);

  if (newlyImportedIds.length > 0) {
    try {
      backfillReport = await backfillMediaVariants({ ids: newlyImportedIds, onlyMissing: true });
    } catch (backfillErr: any) {
      console.warn('Auto-backfill after import failed (non-fatal):', backfillErr?.message);
    }
  }

  return NextResponse.json({
    success: true,
    summary: {
      imported: result.imported,
      skipped: result.skipped,
      errors: result.errors.length,
    },
    backfill: backfillReport
      ? {
          processed: backfillReport.processed,
          succeeded: backfillReport.succeeded,
          failed: backfillReport.failed,
          variantsGenerated: backfillReport.totalGenerated,
        }
      : null,
    errors: result.errors,
    details: result.details,
  });
}
