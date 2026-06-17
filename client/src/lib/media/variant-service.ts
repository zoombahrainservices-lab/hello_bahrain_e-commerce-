import { getSupabase } from '@/lib/db';
import { uploadToR2, downloadFromR2 } from './r2';
import { buildStoragePath, storagePathToPublicUrl } from './urls';
import { generateRasterVariants, processOriginalRaster } from './image-processing';
import { generateSvgPreview } from './svg';
import type { MediaVariantType, MediaItemRow, MediaVariantRow } from './types';

export interface VariantGenerationResult {
  generated: MediaVariantType[];
  skipped: MediaVariantType[];
  errors: string[];
}

function parseMediaDate(row: MediaItemRow): Date {
  return row.created_at ? new Date(row.created_at) : new Date();
}

/**
 * Upload raster WebP variants and insert media_variants rows.
 * Skips variants that already exist for the media item.
 */
export async function persistRasterVariants(
  mediaId: string,
  originalBuffer: Buffer,
  existingVariantNames: Set<string>,
  pathDate: Date,
): Promise<VariantGenerationResult> {
  const supabase = getSupabase();
  const result: VariantGenerationResult = { generated: [], skipped: [], errors: [] };

  const rasterVariants = await generateRasterVariants(originalBuffer);

  for (const v of rasterVariants) {
    if (existingVariantNames.has(v.variant)) {
      result.skipped.push(v.variant);
      continue;
    }

    try {
      const variantPath = buildStoragePath(mediaId, v.variant, 'webp', pathDate);
      const variantUrl = storagePathToPublicUrl(variantPath);

      await uploadToR2({
        storagePath: variantPath,
        buffer: v.buffer,
        contentType: 'image/webp',
      });

      const { error } = await supabase.from('media_variants').insert({
        media_id: mediaId,
        variant: v.variant,
        width: v.width,
        height: v.height,
        file_size_bytes: v.fileSizeBytes,
        mime_type: 'image/webp',
        extension: 'webp',
        format: 'webp',
        storage_path: variantPath,
        public_url: variantUrl,
      });

      if (error) {
        result.errors.push(`${v.variant}: ${error.message}`);
      } else {
        result.generated.push(v.variant);
        existingVariantNames.add(v.variant);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push(`${v.variant}: ${message}`);
    }
  }

  return result;
}

/**
 * Generate and persist SVG preview thumbnail if missing.
 */
export async function persistSvgPreviewVariant(
  mediaId: string,
  svgBuffer: Buffer,
  existingVariantNames: Set<string>,
  pathDate: Date,
): Promise<VariantGenerationResult> {
  const supabase = getSupabase();
  const result: VariantGenerationResult = { generated: [], skipped: [], errors: [] };

  if (existingVariantNames.has('svg_preview')) {
    result.skipped.push('svg_preview');
    return result;
  }

  try {
    const preview = await generateSvgPreview(svgBuffer);
    const previewPath = buildStoragePath(mediaId, 'svg_preview', 'webp', pathDate);
    const previewUrl = storagePathToPublicUrl(previewPath);

    await uploadToR2({
      storagePath: previewPath,
      buffer: preview.buffer,
      contentType: 'image/webp',
    });

    const { error } = await supabase.from('media_variants').insert({
      media_id: mediaId,
      variant: 'svg_preview',
      width: preview.width,
      height: preview.height,
      file_size_bytes: preview.fileSizeBytes,
      mime_type: 'image/webp',
      extension: 'webp',
      format: 'webp',
      storage_path: previewPath,
      public_url: previewUrl,
    });

    if (error) {
      result.errors.push(`svg_preview: ${error.message}`);
    } else {
      result.generated.push('svg_preview');
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    result.errors.push(`svg_preview: ${message}`);
  }

  return result;
}

export interface GenerateMissingVariantsOptions {
  /** When set, use this buffer instead of downloading from R2. */
  buffer?: Buffer;
  /** Restrict generation to these variant names only. */
  onlyVariants?: MediaVariantType[];
}

/**
 * Generate any missing optimized variants for a single media item.
 * Safe to call multiple times — existing variants are skipped.
 */
export async function generateMissingVariantsForMedia(
  mediaId: string,
  options: GenerateMissingVariantsOptions = {},
): Promise<VariantGenerationResult> {
  const supabase = getSupabase();
  const aggregate: VariantGenerationResult = { generated: [], skipped: [], errors: [] };

  const { data: row, error: rowErr } = await supabase
    .from('media_items')
    .select('*')
    .eq('id', mediaId)
    .single();

  if (rowErr || !row) {
    aggregate.errors.push(rowErr?.message ?? 'Media item not found');
    return aggregate;
  }

  const mediaRow = row as MediaItemRow;

  if (mediaRow.status === 'trashed') {
    aggregate.errors.push('Media item is trashed');
    return aggregate;
  }

  const { data: existingRows } = await supabase
    .from('media_variants')
    .select('variant')
    .eq('media_id', mediaId);

  const existingNames = new Set(
    ((existingRows ?? []) as Pick<MediaVariantRow, 'variant'>[]).map((r) => r.variant),
  );

  const pathDate = parseMediaDate(mediaRow);
  const isSvg = mediaRow.mime_type === 'image/svg+xml';

  let buffer = options.buffer;
  if (!buffer) {
    try {
      const downloaded = await downloadFromR2(mediaRow.storage_path);
      buffer = downloaded.buffer;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Download failed';
      aggregate.errors.push(message);
      return aggregate;
    }
  }

  if (isSvg) {
    const svgResult = await persistSvgPreviewVariant(mediaId, buffer, existingNames, pathDate);
    mergeResults(aggregate, svgResult);
    return aggregate;
  }

  let originalBuffer = buffer;
  try {
    const processed = await processOriginalRaster(buffer, mediaRow.mime_type);
    originalBuffer = processed.buffer;

    const shouldReplaceOriginal =
      processed.fileSizeBytes < buffer.length ||
      processed.mimeType !== mediaRow.mime_type;

    if (shouldReplaceOriginal) {
      const newPath = buildStoragePath(
        mediaId,
        'original',
        processed.extension,
        pathDate,
      );
      const newUrl = storagePathToPublicUrl(newPath);

      await uploadToR2({
        storagePath: newPath,
        buffer: processed.buffer,
        contentType: processed.mimeType,
      });

      if (newPath !== mediaRow.storage_path) {
        try {
          const { deleteFromR2 } = await import('./r2');
          await deleteFromR2(mediaRow.storage_path);
        } catch {
          // non-fatal
        }
      }

      await supabase
        .from('media_variants')
        .update({
          width: processed.width,
          height: processed.height,
          file_size_bytes: processed.fileSizeBytes,
          mime_type: processed.mimeType,
          extension: processed.extension,
          format: processed.format,
          storage_path: newPath,
          public_url: newUrl,
        })
        .eq('media_id', mediaId)
        .eq('variant', 'original');

      await supabase
        .from('media_items')
        .update({
          width: processed.width,
          height: processed.height,
          file_size_bytes: processed.fileSizeBytes,
          mime_type: processed.mimeType,
          extension: processed.extension,
          format: processed.format,
          storage_path: newPath,
          public_url: newUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', mediaId);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Original processing failed';
    aggregate.errors.push(message);
    return aggregate;
  }

  const rasterResult = await persistRasterVariants(
    mediaId,
    originalBuffer,
    existingNames,
    pathDate,
  );
  mergeResults(aggregate, rasterResult);

  if (aggregate.generated.length > 0) {
    await supabase
      .from('media_items')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', mediaId);
  }

  return aggregate;
}

export interface BackfillReport {
  processed: number;
  succeeded: number;
  failed: number;
  totalGenerated: number;
  items: {
    mediaId: string;
    fileName: string;
    generated: MediaVariantType[];
    skipped: MediaVariantType[];
    errors: string[];
  }[];
}

export interface BackfillOptions {
  limit?: number;
  offset?: number;
  /** Only process items missing at least one raster/svg preview variant. */
  onlyMissing?: boolean;
  /** When provided, restrict backfill to these specific media item IDs. */
  ids?: string[];
}

/**
 * Batch backfill missing variants for existing media library items.
 */
export async function backfillMediaVariants(options: BackfillOptions = {}): Promise<BackfillReport> {
  const supabase = getSupabase();
  const { limit = 50, offset = 0, onlyMissing = true, ids } = options;

  const report: BackfillReport = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    totalGenerated: 0,
    items: [],
  };

  let query = supabase
    .from('media_items')
    .select('id, original_file_name, mime_type, status, file_size_bytes')
    .or('status.eq.active,status.eq.processing,status.is.null')
    .order('created_at', { ascending: true });

  if (ids && ids.length > 0) {
    query = query.in('id', ids);
  } else {
    query = query.range(offset, offset + limit - 1);
  }

  const { data: items, error } = await query;
  if (error) {
    throw new Error(`Failed to list media items: ${error.message}`);
  }

  for (const item of items ?? []) {
    const mediaId = item.id as string;

    if (onlyMissing) {
      const { data: variants } = await supabase
        .from('media_variants')
        .select('variant')
        .eq('media_id', mediaId);

      const names = new Set(
        ((variants ?? []) as Pick<MediaVariantRow, 'variant'>[]).map((v) => v.variant),
      );
      const isSvg = item.mime_type === 'image/svg+xml';
      const largeArchive = !isSvg && Number(item.file_size_bytes) > 600 * 1024;
      const hasNewVariants = isSvg
        ? names.has('svg_preview')
        : names.has('card') && names.has('xs') && names.has('hero');
      if (hasNewVariants && names.size > 1 && !largeArchive) {
        continue;
      }
    }

    report.processed++;

    const result = await generateMissingVariantsForMedia(mediaId);
    const itemReport = {
      mediaId,
      fileName: item.original_file_name as string,
      generated: result.generated,
      skipped: result.skipped,
      errors: result.errors,
    };
    report.items.push(itemReport);

    if (result.errors.length > 0) {
      report.failed++;
    } else {
      report.succeeded++;
    }
    report.totalGenerated += result.generated.length;
  }

  return report;
}

function mergeResults(target: VariantGenerationResult, source: VariantGenerationResult): void {
  target.generated.push(...source.generated);
  target.skipped.push(...source.skipped);
  target.errors.push(...source.errors);
}
