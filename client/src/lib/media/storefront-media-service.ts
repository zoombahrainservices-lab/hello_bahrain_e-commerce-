import { getSupabase } from '@/lib/db';
import type { MediaVariantType } from './types';
import type { StorefrontImageVariants } from './storefront-urls';

/**
 * Resolves the best URL for a banner image given its media_id.
 * Prefers the `hero` variant; falls back through xl → large → original.
 * Returns null if the media item is not found or not active.
 */
export async function getBannerMediaUrl(mediaId: string): Promise<string | null> {
  const supabase = getSupabase();

  const { data: item } = await supabase
    .from('media_items')
    .select('public_url, status')
    .eq('id', mediaId)
    .maybeSingle();

  if (!item || (item as any).status !== 'active') return null;

  const { data: variants } = await supabase
    .from('media_variants')
    .select('variant, public_url')
    .eq('media_id', mediaId);

  const variantMap: Record<string, string> = {};
  for (const v of (variants ?? []) as { variant: string; public_url: string }[]) {
    if (v.public_url) variantMap[v.variant] = v.public_url;
  }

  return (
    variantMap['hero'] ??
    variantMap['xl'] ??
    variantMap['large'] ??
    variantMap['original'] ??
    (item as any).public_url ??
    null
  );
}

export interface StorefrontProductMedia {
  imageVariants: StorefrontImageVariants | null;
  galleryVariants: StorefrontImageVariants[];
}

type VariantRow = {
  variant: MediaVariantType;
  public_url: string;
};

type MediaJoin = {
  id: string;
  status: string;
  public_url: string | null;
  media_variants: VariantRow[] | null;
};

type ProductMediaRow = {
  product_id: string;
  role: string;
  sort_order: number;
  media_items: MediaJoin | MediaJoin[] | null;
};

function normalizeMediaJoin(join: MediaJoin | MediaJoin[] | null): MediaJoin | null {
  if (!join) return null;
  return Array.isArray(join) ? join[0] ?? null : join;
}

function variantsFromMedia(media: MediaJoin | null): StorefrontImageVariants | null {
  if (!media || media.status !== 'active') return null;

  const variants: StorefrontImageVariants = {};
  for (const row of media.media_variants ?? []) {
    if (row.public_url) {
      variants[row.variant] = row.public_url;
    }
  }

  if (media.public_url) {
    variants.original = media.public_url;
  }

  return Object.keys(variants).length > 0 ? variants : null;
}

/**
 * Batch-load responsive image variants for storefront products.
 * Returns a map keyed by product ID.
 */
export async function getStorefrontMediaForProducts(
  productIds: string[]
): Promise<Map<string, StorefrontProductMedia>> {
  const result = new Map<string, StorefrontProductMedia>();
  if (productIds.length === 0) return result;

  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('product_media')
    .select(`
      product_id,
      role,
      sort_order,
      media_items!inner (
        id,
        status,
        public_url,
        media_variants (
          variant,
          public_url
        )
      )
    `)
    .in('product_id', productIds)
    .eq('media_items.status', 'active')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Failed to load storefront media variants:', error.message);
    return result;
  }

  const grouped = new Map<string, ProductMediaRow[]>();
  for (const row of (data ?? []) as ProductMediaRow[]) {
    const list = grouped.get(row.product_id) ?? [];
    list.push(row);
    grouped.set(row.product_id, list);
  }

  for (const productId of productIds) {
    const rows = grouped.get(productId) ?? [];
    const mainRow = rows.find((r) => r.role === 'main_image');
    const galleryRows = rows.filter((r) => r.role === 'gallery_image');

    const imageVariants = variantsFromMedia(normalizeMediaJoin(mainRow?.media_items ?? null));
    const galleryVariants = galleryRows
      .map((r) => variantsFromMedia(normalizeMediaJoin(r.media_items)))
      .filter((v): v is StorefrontImageVariants => v !== null);

    result.set(productId, { imageVariants, galleryVariants });
  }

  return result;
}
