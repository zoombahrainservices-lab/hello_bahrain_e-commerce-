import { MediaVariantType } from './types';

/**
 * Build a safe R2 storage path for a media object.
 *
 * Format: media/{yyyy}/{mm}/{mediaId}/{variant}.{ext}
 *
 * Examples:
 *   media/2026/06/8fdc7a.../original.jpg
 *   media/2026/06/8fdc7a.../thumb.webp
 *   media/2026/06/8fdc7a.../svg-preview.webp
 */
export function buildStoragePath(
  mediaId: string,
  variant: MediaVariantType | 'original',
  ext: string,
  date: Date = new Date(),
): string {
  const yyyy = date.getFullYear().toString();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const variantSlug = variant === 'svg_preview' ? 'svg-preview' : variant;
  const cleanExt = ext.startsWith('.') ? ext.slice(1) : ext;
  return `media/${yyyy}/${mm}/${mediaId}/${variantSlug}.${cleanExt}`;
}

/**
 * Build the full public CDN URL from an R2 storage path.
 */
export function storagePathToPublicUrl(storagePath: string): string {
  const base = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';
  return `${base}/${storagePath}`;
}
