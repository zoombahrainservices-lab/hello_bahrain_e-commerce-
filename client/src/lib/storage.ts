/**
 * Legacy R2 storage helpers — all base64 upload functions have been removed.
 * New code must go through `client/src/lib/media/media-service.ts` (`createMediaFromUpload`).
 * R2 deletes must use `client/src/lib/media/r2.ts` (`deleteFromR2`).
 */

const getPublicBaseUrl = () => process.env.R2_PUBLIC_BASE_URL!;

// Returns the full public CDN URL for a given R2 object key.
export function getPublicUrl(key: string): string {
  return `${getPublicBaseUrl()}/${key}`;
}

// Extracts the R2 object key from a full public URL.
// Returns null if the URL is not an R2 public URL (e.g. old Supabase URLs).
export function getStorageKeyFromUrl(url: string): string | null {
  const base = getPublicBaseUrl();
  if (!url || !base || !url.startsWith(base + '/')) return null;
  return url.slice(base.length + 1);
}
