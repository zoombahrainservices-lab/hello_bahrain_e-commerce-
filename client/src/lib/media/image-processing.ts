// Sharp is intentionally NOT statically imported here.
// A static `import sharp from 'sharp'` causes webpack to bundle the native .node binary
// which then crashes when the serverless function cold-starts on Vercel (wrong platform
// binary, corrupted bundle). Instead we load it lazily at call-time with webpackIgnore,
// so webpack leaves the import as a real Node.js require that resolves at runtime.
import type sharpDefault from 'sharp';
import {
  MEDIA_VARIANTS,
  WEBP_QUALITY,
  ORIGINAL_MAX_DIMENSION,
  ORIGINAL_JPEG_QUALITY,
  ORIGINAL_WEBP_QUALITY,
  ORIGINAL_PNG_COMPRESSION,
  VariantName,
} from './constants';
import { getExtensionFromMime, getFormatFromMime } from './validation';

type SharpFactory = typeof sharpDefault;
let _sharp: SharpFactory | null = null;

async function loadSharp(): Promise<SharpFactory> {
  if (!_sharp) {
    // webpackIgnore: true tells webpack to skip bundling this module entirely.
    // Node.js resolves it from node_modules at runtime, where the correct
    // platform binary is available.
    const mod = await import(/* webpackIgnore: true */ 'sharp');
    _sharp = (mod.default ?? mod) as SharpFactory;
  }
  return _sharp;
}

export interface ImageMetadata {
  width: number;
  height: number;
  format: string;
  hasAlpha: boolean;
}

export interface ProcessedOriginal {
  buffer: Buffer;
  width: number;
  height: number;
  fileSizeBytes: number;
  mimeType: string;
  extension: string;
  format: string;
}

export interface ProcessedVariant {
  variant: VariantName;
  buffer: Buffer;
  width: number;
  height: number;
  mimeType: 'image/webp';
  extension: 'webp';
  format: 'webp';
  fileSizeBytes: number;
}

/**
 * Extract metadata from a raw image buffer.
 */
export async function getImageMetadata(buffer: Buffer): Promise<ImageMetadata> {
  const sharp = await loadSharp();
  const meta = await sharp(buffer).metadata();
  return {
    width: meta.width ?? 0,
    height: meta.height ?? 0,
    format: meta.format ?? 'unknown',
    hasAlpha: meta.hasAlpha ?? false,
  };
}

/**
 * Generate WebP variants for a raster image.
 */
export async function generateRasterVariants(buffer: Buffer): Promise<ProcessedVariant[]> {
  const sharp = await loadSharp();
  const meta = await sharp(buffer).metadata();
  const originalWidth = meta.width ?? 0;

  if (originalWidth === 0) return [];

  const variants: ProcessedVariant[] = [];
  const seenWidths = new Set<number>();

  for (const [name, maxWidth] of Object.entries(MEDIA_VARIANTS) as [VariantName, number][]) {
    if (maxWidth > originalWidth) continue;

    const targetWidth = maxWidth;
    if (seenWidths.has(targetWidth)) continue;

    const variantBuffer = await sharp(buffer)
      .rotate()
      .resize({
        width: targetWidth,
        withoutEnlargement: true,
        fit: 'inside',
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();

    const variantMeta = await sharp(variantBuffer).metadata();
    const outputWidth = variantMeta.width ?? targetWidth;

    if (seenWidths.has(outputWidth)) continue;
    seenWidths.add(outputWidth);

    variants.push({
      variant: name,
      buffer: variantBuffer,
      width: outputWidth,
      height: variantMeta.height ?? 0,
      mimeType: 'image/webp',
      extension: 'webp',
      format: 'webp',
      fileSizeBytes: variantBuffer.length,
    });
  }

  return variants;
}

/**
 * Optimize the archived original before upload:
 * - Auto-orient and strip metadata
 * - Cap oversized dimensions (max 2560px)
 * - Recompress without destroying visual quality
 * - Convert photographic PNG (no alpha) to JPEG for much smaller archives
 */
export async function processOriginalRaster(
  buffer: Buffer,
  mimeType: string,
): Promise<ProcessedOriginal> {
  const sharp = await loadSharp();
  const meta = await sharp(buffer).metadata();
  const needsResize =
    (meta.width ?? 0) > ORIGINAL_MAX_DIMENSION || (meta.height ?? 0) > ORIGINAL_MAX_DIMENSION;

  let pipeline = sharp(buffer).rotate();

  if (needsResize) {
    pipeline = pipeline.resize({
      width: ORIGINAL_MAX_DIMENSION,
      height: ORIGINAL_MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    });
  }

  const pngWithoutAlpha = mimeType === 'image/png' && !(meta.hasAlpha ?? false);
  let outputMimeType = mimeType;
  let outputExtension = getExtensionFromMime(mimeType);
  let outputFormat = getFormatFromMime(mimeType);

  let output: Buffer;
  if (pngWithoutAlpha) {
    output = await pipeline.jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true }).toBuffer();
    outputMimeType = 'image/jpeg';
    outputExtension = 'jpg';
    outputFormat = 'jpeg';
  } else if (mimeType === 'image/jpeg') {
    output = await pipeline.jpeg({ quality: ORIGINAL_JPEG_QUALITY, mozjpeg: true }).toBuffer();
  } else if (mimeType === 'image/png') {
    output = await pipeline
      .png({ compressionLevel: ORIGINAL_PNG_COMPRESSION, effort: 10 })
      .toBuffer();
  } else if (mimeType === 'image/webp') {
    output = await pipeline.webp({ quality: ORIGINAL_WEBP_QUALITY }).toBuffer();
  } else {
    output = await pipeline.toBuffer();
  }

  const outMeta = await sharp(output).metadata();

  return {
    buffer: output,
    width: outMeta.width ?? meta.width ?? 0,
    height: outMeta.height ?? meta.height ?? 0,
    fileSizeBytes: output.length,
    mimeType: outputMimeType,
    extension: outputExtension,
    format: outputFormat,
  };
}
