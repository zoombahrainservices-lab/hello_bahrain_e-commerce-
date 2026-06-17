import type { MediaItemWithVariants, MediaVariant } from './types';

const DISPLAY_VARIANT_ORDER = ['card', 'medium', 'small', 'thumb', 'xs', 'tiny'] as const;

/** File size shown in admin grid — prefers the card variant used on the storefront. */
export function getAdminDisplayFileSize(item: {
  fileSizeBytes: number;
  variants: MediaVariant[];
}): number | null {
  for (const name of DISPLAY_VARIANT_ORDER) {
    const variant = item.variants.find((v) => v.variant === name);
    if (variant?.fileSizeBytes && variant.fileSizeBytes > 0) {
      return variant.fileSizeBytes;
    }
  }
  return item.fileSizeBytes > 0 ? item.fileSizeBytes : null;
}

export function getOriginalFileSize(item: {
  fileSizeBytes: number;
  variants: MediaVariant[];
}): number | null {
  const original = item.variants.find((v) => v.variant === 'original');
  if (original?.fileSizeBytes && original.fileSizeBytes > 0) {
    return original.fileSizeBytes;
  }
  return item.fileSizeBytes > 0 ? item.fileSizeBytes : null;
}

export function countOptimizedVariants(item: MediaItemWithVariants): number {
  return item.variants.filter(
    (v) => v.variant !== 'original' && v.variant !== 'svg_preview',
  ).length;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
