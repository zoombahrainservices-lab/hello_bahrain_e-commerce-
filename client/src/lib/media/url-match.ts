const R2_BASE = process.env.R2_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? '';

export function normalizeImageUrl(url: string): string {
  return url.split('?')[0].replace(/\/$/, '').trim();
}

/** Extract object key / storage path from a public image URL. */
export function extractStoragePathFromUrl(url: string): string | null {
  if (!url) return null;
  const normalized = normalizeImageUrl(url);

  if (R2_BASE && normalized.startsWith(R2_BASE)) {
    return normalized.slice(R2_BASE.length).replace(/^\//, '');
  }

  const supabaseMatch = normalized.match(/\/storage\/v1\/object\/public\/product-images\/(.+)$/);
  if (supabaseMatch) return supabaseMatch[1];

  try {
    const parsed = new URL(normalized);
    return parsed.pathname.replace(/^\//, '');
  } catch {
    return null;
  }
}

export type MediaLookupRow = {
  id: string;
  public_url: string | null;
  storage_path: string | null;
};

export type MediaUrlIndex = {
  byPublicUrl: Map<string, string>;
  byStoragePath: Map<string, string>;
  byFileName: Map<string, string[]>;
};

export function buildMediaUrlIndex(items: MediaLookupRow[]): MediaUrlIndex {
  const byPublicUrl = new Map<string, string>();
  const byStoragePath = new Map<string, string>();
  const byFileName = new Map<string, string[]>();

  for (const item of items) {
    if (item.public_url) {
      byPublicUrl.set(normalizeImageUrl(item.public_url), item.id);
      const path = extractStoragePathFromUrl(item.public_url);
      if (path) byStoragePath.set(path, item.id);
    }
    if (item.storage_path) {
      byStoragePath.set(item.storage_path, item.id);
    }

    const fileName = (item.storage_path ?? item.public_url ?? '').split('/').pop();
    if (fileName) {
      const list = byFileName.get(fileName) ?? [];
      list.push(item.id);
      byFileName.set(fileName, list);
    }
  }

  return { byPublicUrl, byStoragePath, byFileName };
}

/**
 * Resolve a product image URL to a media_items.id using several strategies.
 */
export function resolveMediaIdFromUrl(url: string, index: MediaUrlIndex): string | null {
  if (!url) return null;

  const normalized = normalizeImageUrl(url);
  const direct = index.byPublicUrl.get(normalized);
  if (direct) return direct;

  const storagePath = extractStoragePathFromUrl(url);
  if (storagePath) {
    const byPath = index.byStoragePath.get(storagePath);
    if (byPath) return byPath;
  }

  const fileName = normalized.split('/').pop();
  if (fileName) {
    const candidates = index.byFileName.get(fileName) ?? [];
    if (candidates.length === 1) return candidates[0];
  }

  return null;
}
